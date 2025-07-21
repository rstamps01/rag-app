from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained(
    "/models_cache/models--mistralai--Mistral-7B-Instruct-v0.2"
)
print("Tokenizer loaded successfully!")
print(f"Vocab size: {tokenizer.vocab_size}")

# Test tokenization
test_text = "Hello, how are you?"
tokens = tokenizer.encode(test_text)
print(f"Test tokens: {tokens}")
decoded = tokenizer.decode(tokens)
print(f"Decoded: {decoded}")
