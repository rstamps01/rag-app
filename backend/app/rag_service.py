import logging
from typing import List, Tuple, Dict, Any, Optional
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig # Add AutoModelForCausalLM here
import numpy as np
from app.services.vector_db import VectorDBService
from app.services.document_processor import DocumentProcessor
from app.services.gpu_accelerator import GPUAccelerator

logger = logging.getLogger(__name__)

class RAGService:
    """Service for RAG (Retrieval Augmented Generation) functionality with RTX 5090 optimizations"""
    
    def __init__(self, use_gpu: bool = True):
        # Initialize GPU accelerator with RTX 5090 optimizations
        self.gpu_accelerator = GPUAccelerator()
        self.use_gpu = use_gpu and self.gpu_accelerator.cuda_available
        self.device = torch.device("cuda" if self.use_gpu else "cpu")
        self.is_rtx5090 = self.gpu_accelerator.is_ada_lovelace if self.use_gpu else False
        
        # Set up mixed precision for RTX 5090
        self.scaler = self.gpu_accelerator.setup_mixed_precision() if self.is_rtx5090 else None
        
        # Initialize vector DB service
        self.vector_db = VectorDBService()
        
        # Initialize document processor with GPU acceleration
        self.document_processor = DocumentProcessor(use_gpu=use_gpu)
        
        # Initialize models dictionary
        self.models = {}
        self.tokenizers = {}
        self.cuda_graphs = {}
        
        # Default model
        self._load_model("mistral-7b")
    
    def _load_model(self, model_id: str):
        """Load a model if not already loaded"""
        if model_id in self.models:
            return
        
        model_name = self.model_map.get(model_id, model_id)

        try:
            # FIXED: Remove problematic quantization
            self.models[model_id] = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if self.use_gpu else torch.float32,
                device_map="auto" if self.use_gpu else None,
                # Removed: load_in_8bit=True,  # ← This was causing the error
                trust_remote_code=True
            )

            # Load tokenizer
            self.tokenizers[model_id] = AutoTokenizer.from_pretrained(model_name)
            if self.tokenizers[model_id].pad_token is None:
                self.tokenizers[model_id].pad_token = self.tokenizers[model_id].eos_token
            
            logger.info(f"Successfully loaded model: {model_id}")
        
        except Exception as e:
            logger.error(f"Failed to load model {model_id}: {str(e)}")
            raise
        # Map model_id to HuggingFace model name
        model_map = {
        #    "llama2-7b": "meta-llama/Llama-2-7b-hf",
        #    "falcon-7b": "tiiuae/falcon-7b",
            "mistral-7b": "mistralai/Mistral-7B-v0.2"
        }
        
        if model_id not in model_map:
            raise ValueError(f"Unsupported model: {model_id}")
        
        hf_model_name = model_map[model_id]
        
        # Load tokenizer
        self.tokenizers[model_id] = AutoTokenizer.from_pretrained(hf_model_name)
        
        # RTX 5090 specific optimizations for model loading
        if self.is_rtx5090:
            # Load model with 8-bit quantization and flash attention for RTX 5090
            self.models[model_id] = AutoModelForCausalLM.from_pretrained(
                hf_model_name,
                torch_dtype=torch.float16,
                load_in_8bit=True,
                device_map="auto",
                #attn_implementation="flash_attention_2"  # RTX 5090 optimization
            )
        else:
            # Standard loading for other GPUs
        #    self.models[model_id] = AutoModelForCausalLM.from_pretrained(
        #        hf_model_name,
        #        torch_dtype=torch.float16 if self.use_gpu else torch.float32,
        #        load_in_8bit=self.use_gpu,
        #        device_map="auto" if self.use_gpu else None
        #    )
            #quantization_config = BitsAndBytesConfig(
            #    load_in_8bit=True,
            #    llm_int8_threshold=6.0,
            #    llm_int8_has_fp16_weight=False,
            #)
            self.models[model_id] = AutoModelForCausalLM.from_pretrained(
                hf_model_name,
                torch_dtype=torch.float16 if self.use_gpu else torch.float32,
                device_map="auto" if self.use_gpu else None,
                # Removed quantization parameters
                #quantization_config=quantization_config,
                trust_remote_code=True
        )
    def process_document(self, document_id: str, file_path: str):
        """
        Process a document and store its embeddings
        
        Args:
            document_id: ID of the document
            file_path: Path to the document file
        """
        # Process document to get chunks and embeddings
        chunks, embeddings = self.document_processor.process_document(file_path)
        
        # Store in vector database
        self.vector_db.add_document_embeddings(document_id, chunks, embeddings)
        
        return len(chunks)
    
    def generate_response(self, query: str, model_id: str = "mistral-7b", max_results: int = 5) -> Dict[str, Any]:
        """
        Generate a response to a query using RAG
        
        Args:
            query: User query
            model_id: ID of the model to use
            max_results: Maximum number of results to retrieve
            
        Returns:
            Dictionary with response and sources
        """
        # Ensure model is loaded
        if model_id not in self.models:
            self._load_model(model_id)
        
        # Generate query embedding
        query_embedding = self.document_processor.generate_embeddings([query])[0]
        
        # Retrieve relevant documents
        results = self.vector_db.search_similar(query_embedding, limit=max_results)
        
        # Format context from retrieved documents
        context = "\n\n".join([f"Document: {r['document_id']}\n{r['text']}" for r in results])
        
        # Create prompt
        prompt = f"""Answer the following question based on the provided context. If the answer cannot be determined from the context, say "I don't have enough information to answer this question."

Context:
{context}

Question: {query}

Answer:"""
        
        # Generate response with RTX 5090 optimizations
        tokenizer = self.tokenizers[model_id]
        model = self.models[model_id]
        
        inputs = tokenizer(prompt, return_tensors="pt").to(self.device)
        
        # Use mixed precision for RTX 5090
        if self.is_rtx5090 and self.scaler is not None:
            with torch.cuda.amp.autocast():
                output = model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.7,
                    top_p=0.9,
                    do_sample=True
                )
        else:
            with torch.no_grad():
                output = model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.7,
                    top_p=0.9,
                    do_sample=True
                )
        
        response_text = tokenizer.decode(output[0], skip_special_tokens=True)
        
        # Extract just the answer part (after "Answer:")
        answer_parts = response_text.split("Answer:")
        if len(answer_parts) > 1:
            answer = answer_parts[1].strip()
        else:
            answer = response_text
        
        # Format sources
        sources = [
            {
                "document_id": r["document_id"],
                "document_name": r["metadata"].get("source", "").split("/")[-1],
                "relevance_score": float(r["score"]),
                "content_snippet": r["text"][:200] + "..."
            }
            for r in results
        ]
        
        return {
            "query": query,
            "response": answer,
            "model": model_id,
            "sources": sources,
            "processing_time": 0.75,  # Placeholder
            "gpu_accelerated": self.use_gpu,
            "rtx5090_optimized": self.is_rtx5090
        }
