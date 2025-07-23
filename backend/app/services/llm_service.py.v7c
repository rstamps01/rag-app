import os
import torch
import logging
from typing import Optional, Dict, Any
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class LLMService:
    """LLM Service for handling model loading and text generation"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.embedding_model = None
        self.model_cache_dir = "/app/models_cache/hub"
        self._initialize_models()

    def _initialize_models(self):
        """Initialize the Mistral model and tokenizer"""
        try:
            model_path = "mistralai/Mistral-7B-Instruct-v0.2"

    ######

            # Load tokenizer and model
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.model = AutoModelForCausalLM.from_pretrained(model_path)

            # ADDED: Configure tokenizer properly
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
                
            # Ensure pad_token_id is set correctly
            if self.tokenizer.pad_token_id is None:
                self.tokenizer.pad_token_id = self.tokenizer.eos_token_id

            logger.info("Mistral-7B model loaded successfully")

    ###### Added 7/22/25 #######
            
            logger.info("Mistral-7B model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load Mistral model: {str(e)}")
            raise
    
    def generate_response(self, query: str, context: str = "", max_length: int = 512) -> str:
        """Generate response using the loaded model"""
        try:
            if not self.model or not self.tokenizer:
                return "Model not properly initialized"
            
            # Prepare prompt with context
            if context:
                prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
            else:
                prompt = f"Question: {query}\n\nAnswer:"

######            
    #        # Tokenize input
    #        inputs = self.tokenizer.encode(prompt, return_tensors="pt")
    #        
    #        # Move to GPU if available
    #        if torch.cuda.is_available():
    #            inputs = inputs.cuda()
    #            self.model = self.model.cuda()
    #
    #        
    #        # Generate response
    #        with torch.no_grad():
    #            outputs = self.model.generate(
    #                inputs,
    #                max_length=max_length,
    #                num_return_sequences=1,
    #                temperature=0.7,
    #                do_sample=True,
    #               pad_token_id=self.tokenizer.eos_token_id
    #            )
######

            # Tokenize input with proper attention mask
            inputs = self.tokenizer(
                prompt, 
                return_tensors="pt", 
                padding=True, 
                truncation=True,
                max_length=1024  # Allow longer input
            )

            # Move to GPU if available
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
                self.model = self.model.cuda()

            # Set pad token if not set
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token

            # Generate response with proper parameters
            with torch.no_grad():
                outputs = self.model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],  # ← FIXED: Add attention mask
                    max_new_tokens=512,                       # ← FIXED: Use max_new_tokens instead of max_length
                    num_return_sequences=1,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.pad_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1,                  # ← ADDED: Prevent repetition
                    length_penalty=1.0                       # ← ADDED: Control length preference
                )
###### Added 7/22/25 #######
            
            # Decode response
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract only the answer part
            if "Answer:" in response:
                response = response.split("Answer:")[-1].strip()
            
            return response
            
        except Exception as e:
            logger.error(f"Response generation failed: {str(e)}")
            return f"Error generating response: {str(e)}"
    
    def load_embedding_model(self) -> SentenceTransformer:
        """Load and return the embedding model"""
        try:
            if not self.embedding_model:
                model_path = f"{self.model_cache_dir}/models--sentence-transformers--all-MiniLM-L6-v2"
                self.embedding_model = SentenceTransformer(model_path)
            return self.embedding_model
        except Exception as e:
            logger.error(f"Failed to load embedding model: {str(e)}")
            raise

# Legacy function support (for backward compatibility)
def load_mistral_model():
    """Legacy function - use LLMService class instead"""
    service = LLMService()
    return service.model, service.tokenizer

def load_embedding_model():
    """Legacy function - use LLMService class instead"""
    service = LLMService()
    return service.load_embedding_model()