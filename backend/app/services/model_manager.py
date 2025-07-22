import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from app.core.gpu_optimizer import configure_gpu, get_optimal_batch_size

class ModelManager:
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        self.available_models = {
            # "gpt-j-6b": "EleutherAI/gpt-j-6B",
            # "llama-2-7b": "meta-llama/Llama-2-7b-hf",
            # "falcon-7b": "tiiuae/falcon-7b",
            "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.2" # Keep only Mistral-7B
        }
        self.use_gpu = configure_gpu()
    
    def load_model(self, model_name):
        """Load a model by name"""
        if model_name not in self.available_models:
            raise ValueError(f"Model {model_name} not available")
        
        if model_name in self.models:
            return self.models[model_name], self.tokenizers[model_name]
        
        model_path = self.available_models[model_name]
        
        # Configure device and quantization
        device_map = "auto" if self.use_gpu else "cpu"
        load_in_8bit = self.use_gpu  # Use 8-bit quantization if GPU available
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(model_path, cache_dir="/app/models_cache")
        
        # Load model with optimizations
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            cache_dir="/app/models_cache", # Added cache_dir
            device_map=device_map,
            load_in_8bit=load_in_8bit,
            torch_dtype=torch.float16 if self.use_gpu else torch.float32,
            attn_implementation="flash_attention_2" if self.use_gpu else "eager"
        )
        
        self.models[model_name] = model
        self.tokenizers[model_name] = tokenizer
        
        return model, tokenizer
    
    def generate_response(self, model_name, prompt, max_length=512):
        """Generate a response using the specified model"""
        model, tokenizer = self.load_model(model_name)
        
        # Prepare inputs
        inputs = tokenizer(prompt, return_tensors="pt")
        if self.use_gpu:
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # Generate with autocast for mixed precision
        #with torch.cuda.amp.autocast(enabled=self.use_gpu):
        with torch.amp.autocast("cuda",enabled=self.use_gpu):
            outputs = model.generate(
                **inputs,
                max_length=max_length,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.2
            )
        
        # Decode and return response
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response[len(prompt):].strip()
