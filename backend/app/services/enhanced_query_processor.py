import os
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncpg
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
from app.services.document_processor import document_processor

class EnhancedQueryProcessor:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.db_pool = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    async def initialize(self):
        """Initialize the query processor"""
        try:
            # Initialize database connection
            database_url = os.getenv("DATABASE_URL", "postgresql://rag:rag@postgres-07:5432/rag")
            self.db_pool = await asyncpg.create_pool(database_url)
            
            # Initialize LLM model
            model_name = os.getenv("LLM_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.2")
            
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None
            )
            
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            logging.info(f"Query processor initialized with model: {model_name}")
            
        except Exception as e:
            logging.error(f"Failed to initialize query processor: {e}")
            # Use fallback mode
            self.model = None
            self.tokenizer = None
    
    async def process_query(self, query: str, department: str = "General") -> Dict[str, Any]:
        """Process a query with document retrieval and AI response"""
        try:
            # Search for relevant documents
            relevant_docs = await document_processor.search_documents(query, limit=5)
            
            # Generate AI response
            if self.model and self.tokenizer:
                response = await self.generate_ai_response(query, relevant_docs)
            else:
                response = await self.generate_fallback_response(query, relevant_docs)
            
            # Store query in history
            query_id = await self.store_query_history(query, response, department, relevant_docs)
            
            return {
                "id": query_id,
                "query": query,
                "response": response,
                "department": department,
                "model": os.getenv("LLM_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.2"),
                "sources": relevant_docs,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logging.error(f"Error processing query: {e}")
            return {
                "query": query,
                "response": f"I apologize, but I encountered an error while processing your query: {str(e)}",
                "department": department,
                "model": "error",
                "sources": [],
                "timestamp": datetime.now().isoformat()
            }
    
    async def generate_ai_response(self, query: str, relevant_docs: List[Dict[str, Any]]) -> str:
        """Generate AI response using the LLM"""
        try:
            # Prepare context from relevant documents
            context = ""
            if relevant_docs:
                context = "\n\nRelevant information from documents:\n"
                for i, doc in enumerate(relevant_docs[:3], 1):
                    context += f"{i}. {doc['content'][:500]}...\n"
            
            # Create prompt
            prompt = f"""<s>[INST] You are a helpful AI assistant specializing in VAST Data storage solutions. Answer the following question based on the provided context and your knowledge.

Question: {query}

{context}

Please provide a comprehensive and accurate answer. If the context doesn't contain relevant information, use your general knowledge about VAST Data and storage solutions. [/INST]"""
            
            # Generate response
            inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True, max_length=2048)
            
            if self.device == "cuda":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode response
            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract only the assistant's response
            if "[/INST]" in response:
                response = response.split("[/INST]")[-1].strip()
            
            return response
            
        except Exception as e:
            logging.error(f"Error generating AI response: {e}")
            return await self.generate_fallback_response(query, relevant_docs)
    
    async def generate_fallback_response(self, query: str, relevant_docs: List[Dict[str, Any]]) -> str:
        """Generate fallback response when AI model is not available"""
        
        # Check if we have relevant documents
        if relevant_docs:
            response = f"Based on the available documentation, here's what I found regarding '{query}':\n\n"
            
            for i, doc in enumerate(relevant_docs[:2], 1):
                response += f"{i}. {doc['content'][:300]}...\n\n"
            
            response += "This information is extracted from your uploaded VAST Data documentation."
        else:
            # Provide general VAST Data information
            if "vast" in query.lower() and "storage" in query.lower():
                response = """VAST Data is a leading storage company that provides high-performance, scalable storage solutions for modern data centers. Their Universal Storage platform combines the economics of object storage with the performance of file and block storage.

Key features of VAST Data storage include:
- Universal Storage Platform that unifies file, object, and block protocols
- Global namespace for seamless data access
- High-performance NVMe storage with intelligent data placement
- Advanced data reduction techniques including deduplication and compression
- Scalable architecture supporting petabyte-scale deployments

For more specific information, please upload relevant VAST Data documentation to get detailed answers about particular features or configurations."""
            else:
                response = f"I understand you're asking about '{query}'. While I don't have specific documentation loaded for this topic, I'd be happy to help if you upload relevant VAST Data documentation. You can also try rephrasing your question or asking about general VAST Data storage concepts."
        
        return response
    
    async def store_query_history(self, query: str, response: str, department: str, sources: List[Dict[str, Any]]) -> int:
        """Store query and response in history"""
        try:
            async with self.db_pool.acquire() as conn:
                query_id = await conn.fetchval("""
                    INSERT INTO query_history (query, response, department, model, sources, created_at)
                    VALUES ($1, $2, $3, $4, $5, NOW())
                    RETURNING id
                """, query, response, department, 
                os.getenv("LLM_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.2"),
                [{"document_id": s.get("document_id"), "score": s.get("score")} for s in sources])
                
                return query_id
                
        except Exception as e:
            logging.error(f"Error storing query history: {e}")
            return 0
    
    async def get_query_history(self, limit: int = 10, skip: int = 0) -> Dict[str, Any]:
        """Get query history"""
        try:
            async with self.db_pool.acquire() as conn:
                # Get total count
                total = await conn.fetchval("SELECT COUNT(*) FROM query_history")
                
                # Get queries
                rows = await conn.fetch("""
                    SELECT id, query, response, department, model, created_at
                    FROM query_history
                    ORDER BY created_at DESC
                    LIMIT $1 OFFSET $2
                """, limit, skip)
                
                queries = []
                for row in rows:
                    queries.append({
                        "id": row["id"],
                        "query": row["query"],
                        "response": row["response"],
                        "department": row["department"],
                        "model": row["model"],
                        "timestamp": row["created_at"].isoformat()
                    })
                
                return {
                    "queries": queries,
                    "total": total,
                    "limit": limit,
                    "skip": skip
                }
                
        except Exception as e:
            logging.error(f"Error getting query history: {e}")
            return {
                "queries": [],
                "total": 0,
                "limit": limit,
                "skip": skip
            }

# Global query processor instance
enhanced_query_processor = EnhancedQueryProcessor()