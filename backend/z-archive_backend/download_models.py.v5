import os
import shutil
import fnmatch # Added for wildcard matching
from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer

# Define cache directory within the container
CACHE_DIR = "/app/models_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# Get token from environment variable
hf_token = os.getenv("HUGGING_FACE_HUB_TOKEN")
if not hf_token:
    print("Warning: HUGGING_FACE_HUB_TOKEN environment variable not set. Downloads for gated models may fail.")

# List of models to pre-download
llm_models_hf_paths = [
    # "EleutherAI/gpt-j-6b",
    # "meta-llama/Llama-2-7b-hf",
    # "tiiuae/falcon-7b",
    "mistralai/Mistral-7B-v0.1" # Keep only Mistral-7B
]

embedding_model_hf_path = "sentence-transformers/all-MiniLM-L6-v2"

print(f"--- Starting model download to {CACHE_DIR} ---")

# Download LLMs and Tokenizers
for model_name in llm_models_hf_paths:
    print(f"Downloading {model_name}...")
    try:
        is_gated = "meta-llama" in model_name or "mistralai" in model_name
        auth_token = hf_token if is_gated else None
        
        print(f"Attempting to download model: {model_name}")
        AutoModelForCausalLM.from_pretrained(
            model_name, 
            cache_dir=CACHE_DIR, 
            token=auth_token, 
            revision="main", 
            use_safetensors=True # Prefer safetensors, will fall back to .bin if not available
        )
        print(f"Attempting to download tokenizer: {model_name}")
        AutoTokenizer.from_pretrained(
            model_name, 
            cache_dir=CACHE_DIR, 
            token=auth_token, 
            revision="main"
        )
        print(f"Successfully downloaded {model_name}.")
    except Exception as e:
        print(f"ERROR downloading {model_name}: {e}")

# Download Embedding Model
print(f"Downloading {embedding_model_hf_path}...")
try:
    SentenceTransformer(embedding_model_hf_path, cache_folder=CACHE_DIR)
    print(f"Successfully downloaded {embedding_model_hf_path}.")
except Exception as e:
    print(f"ERROR downloading {embedding_model_hf_path}: {e}")

print("--- Model download script finished ---")

# --- Cache Inspection BEFORE Pruning ---
print(f"--- Starting Cache Inspection BEFORE Pruning for {CACHE_DIR} ---")
total_size_before = 0
for dirpath, dirnames, filenames in os.walk(CACHE_DIR):
    for f in filenames:
        fp = os.path.join(dirpath, f)
        if os.path.exists(fp): # Ensure file exists (not a broken symlink)
             total_size_before += os.path.getsize(fp)
print(f"Total cache size BEFORE pruning: {total_size_before / (1024*1024*1024):.2f} GB")

# --- Targeted Pruning --- 
print("--- Starting Targeted Pruning --- ")

# Define essential file patterns
essential_patterns = [
    "*.safetensors",
    "pytorch_model*.bin",
    "config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
    "vocab.json", "vocab.txt", "spiece.model", "merges.txt", "tokenizer.model", # Added tokenizer.model for some sentencepiece models
    "generation_config.json",
    "modules.json", 
    "sentence_bert_config.json",
    "*.py", # Keep python files like in sentence-transformers model folders
    "*.md", # Keep markdown files (READMEs etc)
    "*. H", # For sentence transformers, e.g. 1_Pooling/config.json
]

# Helper function to check if a file is essential
def is_essential(filename, patterns):
    # Also keep hidden files like .gitattributes, .gitignore if they are small and part of repo structure
    if filename.startswith("."):
        return True # Keep all hidden files for now, assuming they are small config/meta files
    for pattern in patterns:
        if fnmatch.fnmatch(filename, pattern):
            return True
    return False

# Construct model directory paths based on Hugging Face naming convention
model_dirs_to_prune = []
for model_hf_path in llm_models_hf_paths + [embedding_model_hf_path]:
    # Convert 'org/model' to 'models--org--model-name' for LLMs from HF Hub
    # SentenceTransformer might create 'org_model' or 'sentence-transformers_model' directly
    # The logs showed 'models--sentence-transformers--all-MiniLM-L6-v2', so this convention is likely used.
    dir_name = "models--" + model_hf_path.replace("/", "--")
    model_dirs_to_prune.append(os.path.join(CACHE_DIR, dir_name))

for model_repo_path in model_dirs_to_prune:
    if not os.path.exists(model_repo_path) or not os.path.isdir(model_repo_path):
        print(f"Directory not found or not a dir, skipping pruning: {model_repo_path}")
        continue

    print(f"Pruning directory: {model_repo_path}")
    files_to_delete = []
    
    # Check if safetensors exist for this model in this path
    has_safetensors_in_repo = False
    for dp_check, _, fns_check in os.walk(model_repo_path):
        if any(fnmatch.fnmatch(f_check, "*.safetensors") for f_check in fns_check):
            has_safetensors_in_repo = True
            break
    
    if has_safetensors_in_repo:
        print(f"  Safetensors found for {os.path.basename(model_repo_path)}. Will target .bin files for deletion if also present.")

    for dirpath, dirnames, filenames in os.walk(model_repo_path):
        # To avoid issues with modifying dirnames while iterating, create a copy if needed for subdir pruning
        # For now, focusing on file pruning.

        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            if not os.path.exists(file_path): continue # Skip broken symlinks

            is_essential_file = is_essential(filename, essential_patterns)
            
            if is_essential_file:
                # If it's a .bin file AND safetensors exist for this repo, mark .bin for deletion
                if has_safetensors_in_repo and fnmatch.fnmatch(filename, "pytorch_model*.bin"):
                    print(f"    Marking for deletion (bin file with safetensors present): {file_path}")
                    files_to_delete.append(file_path)
            else:
                # If not essential by pattern, mark for deletion
                print(f"    Marking for deletion (non-essential type): {file_path}")
                files_to_delete.append(file_path)

    # Perform deletions
    deleted_count = 0
    for f_path in files_to_delete:
        try:
            print(f"  Deleting: {f_path}")
            os.remove(f_path)
            deleted_count +=1
        except OSError as e:
            print(f"  Error deleting file {f_path}: {e}")
    print(f"  Deleted {deleted_count} non-essential files from {os.path.basename(model_repo_path)}.")

print("--- Targeted Pruning finished ---")

# --- Cache Inspection AFTER Pruning ---
print(f"--- Starting Cache Inspection AFTER Pruning for {CACHE_DIR} ---")
total_size_after = 0
for dirpath, dirnames, filenames in os.walk(CACHE_DIR):
    for f in filenames:
        fp = os.path.join(dirpath, f)
        if os.path.exists(fp):
            total_size_after += os.path.getsize(fp)
print(f"Total cache size AFTER pruning: {total_size_after / (1024*1024*1024):.2f} GB")

if os.path.exists(CACHE_DIR) and os.path.isdir(CACHE_DIR):
    print("Sizes of top-level items in cache AFTER pruning:")
    for item in os.listdir(CACHE_DIR):
        item_path = os.path.join(CACHE_DIR, item)
        # Calculate size for both files and directories at top level of CACHE_DIR
        current_item_size = 0
        if os.path.isfile(item_path):
            if os.path.exists(item_path):
                current_item_size = os.path.getsize(item_path)
        elif os.path.isdir(item_path):
            for dirpath_inner, _, filenames_inner in os.walk(item_path):
                for f_inner in filenames_inner:
                    fp_inner = os.path.join(dirpath_inner, f_inner)
                    if os.path.exists(fp_inner):
                         current_item_size += os.path.getsize(fp_inner)
        print(f"  Size of {item_path}: {current_item_size / (1024*1024):.2f} MB")

print("--- Cache inspection script finished ---")

