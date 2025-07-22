import logging
from typing import List, Tuple, Dict, Any, Optional
import torch
import time
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
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
        
        # Initialize model mapping dictionary
        self.model_map = {
            "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.2",
            "mistral-7b-instruct": "mistralai/Mistral-7B-Instruct-v0.2",
        }

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
        
        # Get the HuggingFace model name
        model_name = self.model_map.get(model_id, model_id)
        
        if model_id not in self.model_map:
            raise ValueError(f"Unsupported model: {model_id}")

        try:
            # Load tokenizer first
            self.tokenizers[model_id] = AutoTokenizer.from_pretrained(model_name)
            if self.tokenizers[model_id].pad_token is None:
                self.tokenizers[model_id].pad_token = self.tokenizers[model_id].eos_token
            
            # Load model with appropriate settings
            if self.is_rtx5090:
                # RTX 5090 optimized loading
                self.models[model_id] = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    trust_remote_code=True
                )
            else:
                # Standard loading for other GPUs
                self.models[model_id] = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16 if self.use_gpu else torch.float32,
                    device_map="auto" if self.use_gpu else None,
                    trust_remote_code=True
                )
            
            logger.info(f"Successfully loaded model: {model_id}")
        
        except Exception as e:
            logger.error(f"Failed to load model {model_id}: {str(e)}")
            raise
    
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
        start_time = time.time()
        
        try:
            # Ensure model is loaded
            if model_id not in self.models:
                self._load_model(model_id)
            
            # FIXED: Generate query embedding using correct method
            # Try different possible method names
            if hasattr(self.document_processor, 'encode'):
                query_embedding = self.document_processor.encode([query])[0]
            elif hasattr(self.document_processor, 'get_embeddings'):
                query_embedding = self.document_processor.get_embeddings([query])[0]
            elif hasattr(self.document_processor.embedding_model, 'encode'):
                query_embedding = self.document_processor.embedding_model.encode([query])[0]
            else:
                # Fallback: create a simple embedding method call
                raise AttributeError("No suitable embedding method found on DocumentProcessor")
            
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
                        do_sample=True,
                        pad_token_id=tokenizer.eos_token_id
                    )
            else:
                with torch.no_grad():
                    output = model.generate(
                        **inputs,
                        max_new_tokens=512,
                        temperature=0.7,
                        top_p=0.9,
                        do_sample=True,
                        pad_token_id=tokenizer.eos_token_id
                    )
            
            response_text = tokenizer.decode(output[0], skip_special_tokens=True)
            
            # Extract just the answer part (after "Answer:")
            answer_parts = response_text.split("Answer:")
            if len(answer_parts) > 1:
                answer = answer_parts[1].strip()
            else:
                answer = response_text
            
            # Format sources
            #sources = [
            #    {
            #        "document_id": r["document_id"],
            #        "document_name": r["metadata"].get("source", "").split("/")[-1],
            #        "relevance_score": float(r["score"]),
            #        "content_snippet": r["text"][:200] + "..."
            #    }
            #    for r in results
            #]
            
            sources = []
            for r in results:
                try:
                    # Try different possible field names for document_id
                    doc_id = None
                    if "document_id" in r:
                        doc_id = r["document_id"]
                    elif "id" in r:
                        doc_id = r["id"]
                    elif "payload" in r and "document_id" in r["payload"]:
                        doc_id = r["payload"]["document_id"]
                    elif "payload" in r and "id" in r["payload"]:
                        doc_id = r["payload"]["id"]
                    else:
                        doc_id = "unknown"
                    
                    # Try different possible field names for text content
                    text_content = ""
                    if "text" in r:
                        text_content = r["text"]
                    elif "payload" in r and "text" in r["payload"]:
                        text_content = r["payload"]["text"]
                    elif "payload" in r and "content" in r["payload"]:
                        text_content = r["payload"]["content"]
                    
                    # Try different possible field names for metadata
                    metadata = {}
                    if "metadata" in r:
                        metadata = r["metadata"]
                    elif "payload" in r and "metadata" in r["payload"]:
                        metadata = r["payload"]["metadata"]
                    elif "payload" in r:
                        metadata = r["payload"]
                    
                    source_name = metadata.get("source", metadata.get("filename", "unknown"))
                    if "/" in source_name:
                        source_name = source_name.split("/")[-1]
                    
                    sources.append({
                        "document_id": doc_id,
                        "document_name": source_name,
                        "relevance_score": float(r.get("score", 0.0)),
                        "content_snippet": text_content[:200] + "..." if text_content else "No content available"
                    })
                except Exception as e:
                    logger.error(f"Error processing search result: {e}")
                    # Add a fallback source entry
                    sources.append({
                        "document_id": "error",
                        "document_name": "unknown",
                        "relevance_score": 0.0,
                        "content_snippet": "Error processing source"
                    })

########Revised section above to line 198############

            processing_time = time.time() - start_time
            
            return {
                "query": query,
                "response": answer,
                "model": model_id,
                "sources": sources,
                "processing_time": processing_time,
                "gpu_accelerated": self.use_gpu,
                "rtx5090_optimized": self.is_rtx5090
            }
            
        except Exception as e:
            logger.error(f"Error in generate_response: {str(e)}")
            processing_time = time.time() - start_time
            return {
                "query": query,
                "response": f"Error processing query: {str(e)}",
                "model": model_id,
                "sources": [],
                "processing_time": processing_time,
                "gpu_accelerated": False,
                "rtx5090_optimized": False
            }