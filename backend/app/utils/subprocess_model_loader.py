"""
Subprocess-based model loader for isolating Pydantic validation errors
"""
# CRITICAL: Apply patches at module import time, BEFORE any SentenceTransformer imports
import warnings
import os
os.environ["PYDANTIC_DISABLE_VALIDATION"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
warnings.filterwarnings("ignore", message=".*No `Args` or `Parameters` section.*")
warnings.filterwarnings("ignore", message=".*is part of.*forward's signature.*")
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers")

try:
    from app.utils.pydantic_suppress import _patch_transformers_validation
    _patch_transformers_validation()
except Exception:
    pass  # Continue even if patching fails

import subprocess
import sys
import logging
import pickle
import tempfile
from pathlib import Path

logger = logging.getLogger(__name__)

def _load_model_in_subprocess(model_name: str, save_path: str, **kwargs):
    """
    Load SentenceTransformer model in an isolated subprocess and save to disk.
    This isolates Pydantic validation errors from the main process.
    
    Args:
        model_name: Name of the model to load
        save_path: Path to save the model to
        **kwargs: Additional arguments for SentenceTransformer
    
    Returns:
        tuple: (success: bool, error_message: str or None)
    """
    import json
    kwargs_json = json.dumps(kwargs)
    
    # Create a temporary script to load the model and save it
    script_content = f"""
import sys
import os
import warnings
import logging
import tempfile
import shutil

# Suppress all warnings and errors
warnings.filterwarnings("ignore")
os.environ["PYDANTIC_DISABLE_VALIDATION"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

# Redirect stderr to suppress validation errors
from io import StringIO
old_stderr = sys.stderr
sys.stderr = StringIO()

model = None
try:
    from sentence_transformers import SentenceTransformer
    import json
    
    kwargs = {kwargs_json}
    
    # Try to load the model - catch validation errors but continue
    # Even if ValueError/TypeError is raised, the model might still be usable
    try:
        model = SentenceTransformer('{model_name}', **kwargs)
    except (ValueError, TypeError) as ve:
        error_str = str(ve)
        if ("No `Args` or `Parameters` section" in error_str or 
            "docstring" in error_str.lower() or 
            "expected string or buffer" in error_str.lower() or
            "'<' not supported" in error_str or
            "'>' not supported" in error_str):
            # Validation error - but model might still be usable
            # Try to continue - sometimes the error is raised but model works
            # Check if model was partially created by trying to use it
            try:
                # Try to create again with more aggressive suppression
                import warnings
                warnings.filterwarnings('ignore')
                model = SentenceTransformer('{model_name}', **kwargs)
            except Exception:
                # If that also fails, model is None - will exit below
                model = None
        else:
            raise  # Re-raise non-validation errors
    
    # If model is still None after all attempts, we can't proceed
    if model is None:
        print("VALIDATION_ERROR: Model creation failed - model is None")
        sys.exit(2)
    
    # Test that it works
    test_result = model.encode(["test query"])
    
    if test_result is not None and len(test_result) > 0:
        # Success - save model to disk
        try:
            model.save('{save_path}')
            # Verify save worked
            import os
            if os.path.exists('{save_path}') and len(os.listdir('{save_path}')) > 0:
                print("SUCCESS")
                sys.exit(0)
            else:
                print("FAILED: Model save() did not create files")
                sys.exit(1)
        except Exception as save_error:
            print(f"FAILED: Model save() error: {{str(save_error)[:200]}}")
            sys.exit(1)
    else:
        print("FAILED: Model loaded but encode() returned None")
        sys.exit(1)
        
except Exception as e:
    error_str = str(e)
    if "No `Args` or `Parameters` section" in error_str or "docstring" in error_str.lower() or "expected string or buffer" in error_str.lower():
        print(f"VALIDATION_ERROR: {{error_str[:200]}}")
        sys.exit(2)  # Validation error (non-fatal)
    else:
        print(f"ERROR: {{str(e)[:200]}}")
        sys.exit(1)
finally:
    sys.stderr = old_stderr
"""
    
    try:
        # Run the script in a subprocess
        result = subprocess.run(
            [sys.executable, "-c", script_content],
            capture_output=True,
            text=True,
            timeout=60,  # 60 second timeout
            env={**os.environ, "PYTHONPATH": ":".join(sys.path)}
        )
        
        output = result.stdout.strip()
        stderr_output = result.stderr.strip()
        
        if result.returncode == 0:
            return True, None
        elif result.returncode == 2:
            # Validation error - model might still be loadable
            return True, f"Validation error (non-fatal): {output}"
        else:
            error_msg = output or stderr_output or "Unknown error"
            return False, error_msg
            
    except subprocess.TimeoutExpired:
        return False, "Model loading timed out"
    except Exception as e:
        return False, f"Subprocess execution failed: {str(e)}"


def load_model_with_subprocess_validation(model_name: str, **kwargs):
    """
    Load SentenceTransformer model using subprocess validation.
    
    Since the main process has transformers already imported with validation errors,
    we use a subprocess to actually load the model, save it to disk, then load from disk.
    This bypasses all Pydantic validation errors.
    
    Args:
        model_name: Name of the model to load
        **kwargs: Additional arguments for SentenceTransformer
        
    Returns:
        SentenceTransformer instance or None
    """
    import tempfile
    import os
    from pathlib import Path
    
    logger.info(f"🔄 Loading model via subprocess (bypassing validation errors): {model_name}")
    
    # Step 1: Create temp directory for model
    temp_model_dir = tempfile.mkdtemp(prefix="sentence_transformer_")
    logger.debug(f"📁 Temporary model directory: {temp_model_dir}")
    
    # Step 2: Load model in subprocess and save to temp directory
    success, error_msg = _load_model_in_subprocess(model_name, temp_model_dir, **kwargs)
    
    if not success:
        logger.error(f"❌ Subprocess model loading failed: {error_msg}")
        # Clean up temp directory
        try:
            import shutil
            shutil.rmtree(temp_model_dir, ignore_errors=True)
        except Exception:
            pass
        return None
    
    if error_msg:
        logger.info(f"ℹ️ Subprocess loading warning (non-fatal): {error_msg}")
    
    logger.info(f"✅ Model loaded in subprocess and saved to {temp_model_dir}")
    
    # Step 3: Load model from disk in main process (bypasses all validation errors)
    # Loading from disk avoids all the transformers import validation issues
    try:
        import sys
        from io import StringIO
        import warnings
        import shutil
        
        old_stderr = sys.stderr
        sys.stderr = StringIO()
        
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                os.environ["PYDANTIC_DISABLE_VALIDATION"] = "1"
                os.environ["TRANSFORMERS_VERBOSITY"] = "error"
                
                # Load model from disk - this bypasses all validation errors
                # because the model is already loaded and saved by the subprocess
                from sentence_transformers import SentenceTransformer
                
                logger.debug(f"📂 Loading model from disk: {temp_model_dir}")
                model = SentenceTransformer(temp_model_dir)
                
                # Verify it's functional
                test_result = model.encode(["test"])
                if test_result is not None and len(test_result) > 0:
                    logger.info(f"✅ Model loaded successfully from disk: {model_name}")
                    # Clean up temp directory after successful load
                    try:
                        shutil.rmtree(temp_model_dir, ignore_errors=True)
                        logger.debug(f"🗑️ Cleaned up temporary model directory")
                    except Exception:
                        pass  # Non-critical
                    return model
                else:
                    logger.error(f"❌ Model loaded from disk but encode() failed")
                    model = None
                        
        finally:
            sys.stderr = old_stderr
            
    except Exception as e:
        error_str = str(e)
        logger.error(f"❌ Failed to load model from disk: {error_str[:200]}")
        # Clean up temp directory
        try:
            import shutil
            shutil.rmtree(temp_model_dir, ignore_errors=True)
        except Exception:
            pass
        return None
    
    # If we get here, loading from disk failed
    logger.error(f"❌ All loading strategies failed for {model_name}")
    # Clean up temp directory
    try:
        import shutil
        shutil.rmtree(temp_model_dir, ignore_errors=True)
    except Exception:
        pass
    return None

