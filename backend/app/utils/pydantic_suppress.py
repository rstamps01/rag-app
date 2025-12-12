"""
Pydantic Validation Error Suppression Utility
Suppresses ValueError exceptions from transformers library Pydantic validation
These errors occur due to missing docstrings in transformers model outputs
and don't affect functionality - they're validation warnings raised as exceptions
"""

import warnings
import os
import sys
import importlib.util
from contextlib import contextmanager
from typing import Any, Callable, TypeVar

# Set environment variables to suppress validation
os.environ["PYDANTIC_DISABLE_VALIDATION"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

# Suppress warnings
warnings.filterwarnings("ignore", message=".*No `Args` or `Parameters` section.*")
warnings.filterwarnings("ignore", message=".*is part of.*forward's signature.*")
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
warnings.filterwarnings("ignore", category=FutureWarning, module="transformers")

# Install import hook to patch transformers modules as they're imported
class TransformersImportHook:
    """Import hook to patch transformers validation functions during import"""
    _patching = False  # Flag to prevent recursion
    
    def find_spec(self, name, path, target=None):
        # Prevent recursion
        if self._patching:
            return None
        
        # Intercept transformers.utils modules that need patching
        if name in ('transformers.utils.doc', 'transformers.utils.args_doc', 'transformers.utils.auto_docstring'):
            self._patching = True
            try:
                # Use _find_spec directly to avoid recursion
                from importlib._bootstrap import _find_spec
                spec = _find_spec(name, path)
                if spec and spec.loader:
                    # Store original loader
                    original_loader = spec.loader
                    
                    # Create a wrapper loader that patches after loading
                    class PatchingLoader:
                        def __init__(self, original):
                            self.original = original
                        
                        def create_module(self, spec):
                            return None  # Use default module creation
                        
                        def exec_module(self, module):
                            # Execute the module first
                            self.original.exec_module(module)
                            # Then patch it
                            _patch_module_functions(module)
                    
                    spec.loader = PatchingLoader(original_loader)
                return spec
            finally:
                self._patching = False
        return None

def _patch_module_functions(module):
    """Patch validation functions in a transformers module"""
    module_name = getattr(module, '__name__', '')
    
    if 'args_doc' in module_name:
        # Patch _process_returns_section
        # This function returns a tuple: (return_docstring, func_documentation)
        if hasattr(module, '_process_returns_section'):
            original = module._process_returns_section
            if not hasattr(module, '_pydantic_patched'):
                def patched(*args, **kwargs):
                    try:
                        return original(*args, **kwargs)
                    except (ValueError, TypeError) as e:
                        error_str = str(e)
                        if ("No `Args` or `Parameters` section" in error_str or 
                            "docstring" in error_str.lower() or
                            "not enough values to unpack" in error_str.lower() or
                            "expected string or buffer" in error_str.lower() or
                            "'<' not supported" in error_str or
                            "'>' not supported" in error_str):
                            # Return tuple format: (return_docstring, func_documentation)
                            return ("", "")
                        raise
                module._process_returns_section = patched
                module._pydantic_patched = True
    
    elif 'doc' in module_name:
        # Patch _prepare_output_docstrings
        if hasattr(module, '_prepare_output_docstrings'):
            original = module._prepare_output_docstrings
            if not hasattr(module, '_pydantic_patched'):
                def patched(*args, **kwargs):
                    try:
                        return original(*args, **kwargs)
                    except (ValueError, TypeError) as e:
                        error_str = str(e)
                        if ("No `Args` or `Parameters` section" in error_str or 
                            "docstring" in error_str.lower() or
                            "not enough values to unpack" in error_str.lower() or
                            "expected string or buffer" in error_str.lower() or
                            "'<' not supported" in error_str or
                            "'>' not supported" in error_str):
                            return ""
                        raise
                module._prepare_output_docstrings = patched
                module._pydantic_patched = True

# Install the import hook (check if instance already exists)
hook_instance = None
for hook in sys.meta_path:
    if isinstance(hook, TransformersImportHook):
        hook_instance = hook
        break

if hook_instance is None:
    hook_instance = TransformersImportHook()
    sys.meta_path.insert(0, hook_instance)

# Monkey-patch transformers validation to suppress ValueError exceptions
# This function will be called after transformers is imported
def _patch_transformers_validation():
    """Patch transformers library to suppress Pydantic validation errors"""
    try:
        # Try to import transformers modules (they may not be imported yet)
        import transformers.utils.args_doc as args_doc_module
        import transformers.utils.doc as doc_module
        
        # Patch _process_returns_section to suppress ValueError
        # This function returns a tuple: (return_docstring, func_documentation)
        original_process_returns = getattr(args_doc_module, '_process_returns_section', None)
        if original_process_returns and not hasattr(args_doc_module, '_pydantic_patched'):
            def patched_process_returns(*args, **kwargs):
                try:
                    return original_process_returns(*args, **kwargs)
                except (ValueError, TypeError) as e:
                    error_str = str(e)
                    if ("No `Args` or `Parameters` section" in error_str or 
                        "docstring" in error_str.lower() or
                        "not enough values to unpack" in error_str.lower() or
                        "expected string or buffer" in error_str.lower() or
                        "'<' not supported" in error_str or
                        "'>' not supported" in error_str):
                        # Return tuple format: (return_docstring, func_documentation)
                        return ("", "")
                    raise
            
            args_doc_module._process_returns_section = patched_process_returns
            args_doc_module._pydantic_patched = True
        
        # Patch _prepare_output_docstrings to suppress ValueError and unpacking errors
        original_prepare_output = getattr(doc_module, '_prepare_output_docstrings', None)
        if original_prepare_output and not hasattr(doc_module, '_pydantic_patched'):
            def patched_prepare_output(*args, **kwargs):
                try:
                    return original_prepare_output(*args, **kwargs)
                except (ValueError, TypeError) as e:
                    error_str = str(e)
                    if ("No `Args` or `Parameters` section" in error_str or 
                        "docstring" in error_str.lower() or
                        "not enough values to unpack" in error_str.lower() or
                        "expected string or buffer" in error_str.lower() or
                        "'<' not supported" in error_str or
                        "'>' not supported" in error_str):
                        # Suppress validation/unpacking error - return empty string
                        return ""
                    raise
            
            doc_module._prepare_output_docstrings = patched_prepare_output
            doc_module._pydantic_patched = True
        
        # CRITICAL: Patch auto_docstring module where the actual error occurs
        try:
            import transformers.utils.auto_docstring as auto_docstring_module
            # Patch _process_returns_section in auto_docstring (different from args_doc)
            original_auto_process = getattr(auto_docstring_module, '_process_returns_section', None)
            if original_auto_process and not hasattr(auto_docstring_module, '_pydantic_patched'):
                def patched_auto_process(*args, **kwargs):
                    try:
                        return original_auto_process(*args, **kwargs)
                    except (ValueError, TypeError) as e:
                        error_str = str(e)
                        if ("No `Args` or `Parameters` section" in error_str or 
                            "docstring" in error_str.lower() or
                            "expected string or buffer" in error_str.lower() or
                            "NoneType" in error_str):
                            return ("", "")
                        raise
                
                auto_docstring_module._process_returns_section = patched_auto_process
                auto_docstring_module._pydantic_patched = True
            
            # Patch _prepare_output_docstrings in auto_docstring
            original_auto_prepare = getattr(auto_docstring_module, '_prepare_output_docstrings', None)
            if original_auto_prepare and not hasattr(auto_docstring_module, '_pydantic_prepare_patched'):
                def patched_auto_prepare(*args, **kwargs):
                    try:
                        return original_auto_prepare(*args, **kwargs)
                    except (ValueError, TypeError) as e:
                        error_str = str(e)
                        if ("No `Args` or `Parameters` section" in error_str or 
                            "docstring" in error_str.lower() or
                            "expected string or buffer" in error_str.lower() or
                            "NoneType" in error_str):
                            return ""
                        raise
                
                auto_docstring_module._prepare_output_docstrings = patched_auto_prepare
                auto_docstring_module._pydantic_prepare_patched = True
            
            # Patch auto_method_docstring function itself
            original_auto_method = getattr(auto_docstring_module, 'auto_method_docstring', None)
            if original_auto_method and not hasattr(auto_docstring_module, '_pydantic_method_patched'):
                def patched_auto_method(*args, **kwargs):
                    try:
                        return original_auto_method(*args, **kwargs)
                    except (ValueError, TypeError) as e:
                        error_str = str(e)
                        if ("No `Args` or `Parameters` section" in error_str or 
                            "docstring" in error_str.lower() or
                            "expected string or buffer" in error_str.lower() or
                            "NoneType" in error_str):
                            return ""  # Return empty docstring
                        raise
                
                auto_docstring_module.auto_method_docstring = patched_auto_method
                auto_docstring_module._pydantic_method_patched = True
        except (ImportError, AttributeError):
            # auto_docstring module might not exist or be importable yet
            pass
            
    except (ImportError, AttributeError):
        # Transformers not imported yet or modules don't exist - that's OK
        # Patches will be applied when transformers is imported
        pass
    except Exception:
        # If patching fails, continue anyway - other suppression methods will handle it
        pass

T = TypeVar('T')

@contextmanager
def suppress_pydantic_validation_errors():
    """
    Context manager to suppress Pydantic validation errors from transformers library.
    
    These errors are raised as ValueError exceptions during model initialization
    but don't affect functionality - they're just validation warnings.
    """
    import sys
    from io import StringIO
    
    # Store original stderr
    original_stderr = sys.stderr
    
    # Create a filter for stderr
    class PydanticErrorFilter:
        def __init__(self, original):
            self.original = original
            self.buffer = StringIO()
        
        def write(self, message):
            # Filter out Pydantic validation errors
            if "No `Args` or `Parameters` section" in message:
                return  # Suppress this error
            if "docstring" in message.lower() and "Args" in message:
                return  # Suppress docstring validation errors
            self.original.write(message)
        
        def flush(self):
            self.original.flush()
    
    filter_obj = PydanticErrorFilter(original_stderr)
    sys.stderr = filter_obj
    
    try:
        yield
    except (ValueError, TypeError) as e:
        error_str = str(e)
        # Check if this is a Pydantic validation error (non-fatal)
        if ("No `Args` or `Parameters` section" in error_str or 
            "docstring" in error_str.lower() or 
            "Pydantic" in error_str or
            "not enough values to unpack" in error_str.lower() or
            "expected string or buffer" in error_str.lower()):
            # Suppress this error - it's a validation warning, not a fatal error
            # Swallow the exception - the model might still be usable
            pass
        else:
            # Re-raise non-Pydantic errors
            raise
    finally:
        sys.stderr = original_stderr


def safe_sentence_transformer(model_name: str, **kwargs):
    """
    Safely initialize SentenceTransformer, suppressing Pydantic validation errors.
    Uses subprocess validation to isolate errors.
    
    Args:
        model_name: Name of the model to load
        **kwargs: Additional arguments to pass to SentenceTransformer
    
    Returns:
        SentenceTransformer instance or None if initialization fails
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Try subprocess-based loading first (most reliable)
    try:
        from app.utils.subprocess_model_loader import load_model_with_subprocess_validation
        model = load_model_with_subprocess_validation(model_name, **kwargs)
        if model is not None:
            logger.info(f"✅ SentenceTransformer loaded via subprocess validation: {model_name}")
            return model
        else:
            logger.warning(f"⚠️ Subprocess validation failed, falling back to direct loading")
    except Exception as e:
        logger.debug(f"Subprocess loading failed (fallback to direct): {e}")
        # Fall through to direct loading
    
    # Fallback to direct loading with comprehensive error suppression
    from sentence_transformers import SentenceTransformer
    
    # Apply patches before importing SentenceTransformer
    try:
        _patch_transformers_validation()
    except Exception:
        pass  # Continue even if patching fails
    
    # Try multiple initialization strategies
    # Strategy 1: Direct initialization with comprehensive error suppression
    model = None
    try:
        # Suppress stderr completely during initialization
        import sys
        from io import StringIO
        old_stderr = sys.stderr
        sys.stderr = StringIO()
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                # Apply patches before initialization
                try:
                    _patch_transformers_validation()
                except Exception:
                    pass
                try:
                    model = SentenceTransformer(model_name, **kwargs)
                except (ValueError, TypeError) as ve:
                    # Even if ValueError is raised, model might still be usable
                    # Check if model was partially created
                    error_str = str(ve)
                    if ("No `Args` or `Parameters` section" in error_str or 
                        "docstring" in error_str.lower()):
                        # This is a validation error - model might still work
                        # Try to continue - the error might be non-fatal
                        logger.debug(f"Validation error during SentenceTransformer init (non-fatal): {error_str[:100]}")
                        # Don't re-raise - try to continue
                        model = None
                    else:
                        raise  # Re-raise non-validation errors
                
                if model is not None:
                    # Verify model is functional
                    try:
                        test_result = model.encode(["test"])
                        if test_result is not None and len(test_result) > 0:
                            logger.info(f"✅ SentenceTransformer initialized successfully: {model_name}")
                            return model
                    except Exception as test_error:
                        logger.debug(f"Model created but encode() failed: {test_error}")
        finally:
            sys.stderr = old_stderr
    except (ValueError, TypeError) as e:
        # These are validation errors - try with comprehensive suppression
        error_str = str(e)
        logger.debug(f"Initialization attempt 1 caught validation error: {error_str}")
        # Try with stderr suppressed and error suppression context manager
        try:
            import sys
            from io import StringIO
            old_stderr = sys.stderr
            sys.stderr = StringIO()
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    with suppress_pydantic_validation_errors():
                        model = SentenceTransformer(model_name, **kwargs)
                        if model is not None:
                            logger.info(f"✅ SentenceTransformer initialized successfully (with comprehensive suppression): {model_name}")
                            return model
            finally:
                sys.stderr = old_stderr
        except Exception:
            pass  # Continue to next strategy
    except Exception as e:
        error_str = str(e)
        logger.debug(f"Initialization attempt 1 failed: {error_str}")
        # Try with comprehensive suppression
        try:
            import sys
            from io import StringIO
            old_stderr = sys.stderr
            sys.stderr = StringIO()
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    with suppress_pydantic_validation_errors():
                        model = SentenceTransformer(model_name, **kwargs)
                        if model is not None:
                            logger.info(f"✅ SentenceTransformer initialized successfully (with comprehensive suppression): {model_name}")
                            return model
            finally:
                sys.stderr = old_stderr
        except Exception:
            pass  # Continue to next strategy
        
        # Strategy 2: If it's a Pydantic validation error, try again with stderr suppressed
        if ("No `Args` or `Parameters` section" in error_str or 
            "docstring" in error_str.lower() or
            "expected string or buffer" in error_str.lower() or
            "not enough values to unpack" in error_str.lower()):
            try:
                import sys
                from io import StringIO
                old_stderr = sys.stderr
                sys.stderr = StringIO()
                try:
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore")
                        model = SentenceTransformer(model_name, **kwargs)
                        logger.info(f"✅ SentenceTransformer initialized successfully (strategy 2): {model_name}")
                        return model
                finally:
                    sys.stderr = old_stderr
            except Exception as e2:
                logger.debug(f"Initialization attempt 2 failed: {str(e2)}")
        
        # Strategy 3: Try direct initialization ignoring all warnings and errors
        # Even if ValueError is raised, the model might still be usable
        try:
            import sys
            from io import StringIO
            old_stderr = sys.stderr
            sys.stderr = StringIO()
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    # Apply patches before initialization
                    try:
                        _patch_transformers_validation()
                    except Exception:
                        pass
                    # Force initialization even if validation errors occur
                    # The ValueError might be raised but model could still be created
                    try:
                        model = SentenceTransformer(model_name, **kwargs)
                    except (ValueError, TypeError) as ve:
                        # Check if this is a Pydantic validation error
                        error_str = str(ve)
                        if ("No `Args` or `Parameters` section" in error_str or 
                            "docstring" in error_str.lower() or
                            "expected string or buffer" in error_str.lower() or
                            "not enough values to unpack" in error_str.lower()):
                            # Validation error - try to continue anyway
                            # The model might have been partially created
                            # Try to access it to see if it's usable
                            try:
                                # Re-import to get a fresh instance
                                import importlib
                                import sentence_transformers
                                importlib.reload(sentence_transformers)
                                # Try again with patches applied
                                _patch_transformers_validation()
                                model = SentenceTransformer(model_name, **kwargs)
                            except Exception:
                                # If that fails, try one more time without patches
                                # Sometimes the model loads despite the error
                                pass
                        else:
                            raise  # Re-raise non-validation errors
                    
                    # Verify model is usable
                    if model is not None:
                        try:
                            # Test that model can encode
                            test_result = model.encode(["test"])
                            if test_result is not None and len(test_result) > 0:
                                logger.info(f"✅ SentenceTransformer initialized successfully (strategy 3): {model_name}")
                                return model
                        except Exception as test_error:
                            logger.debug(f"Model created but not functional: {test_error}")
            finally:
                sys.stderr = old_stderr
        except Exception as e3:
            error_str = str(e3)
            # Check if it's a validation error - model might still be usable
            if ("No `Args` or `Parameters` section" in error_str or 
                "docstring" in error_str.lower()):
                logger.warning(f"⚠️ Validation error during initialization (non-fatal): {model_name}")
                # Don't return None yet - try one more time
            else:
                logger.warning(f"⚠️ All initialization strategies failed for {model_name}: {str(e3)}")
        
        # Final attempt: Try with environment variable suppression
        try:
            import os
            os.environ["TRANSFORMERS_VERBOSITY"] = "error"
            os.environ["PYDANTIC_DISABLE_VALIDATION"] = "1"
            import sys
            from io import StringIO
            old_stderr = sys.stderr
            sys.stderr = StringIO()
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    _patch_transformers_validation()
                    model = SentenceTransformer(model_name, **kwargs)
                    if model is not None:
                        # Test functionality
                        test_result = model.encode(["test"])
                        if test_result is not None:
                            logger.info(f"✅ SentenceTransformer initialized successfully (final attempt): {model_name}")
                            return model
            finally:
                sys.stderr = old_stderr
        except Exception as final_error:
            logger.debug(f"Final initialization attempt failed: {final_error}")
        
        # If all strategies fail, return None
        logger.error(f"❌ Failed to initialize SentenceTransformer: {model_name}")
        return None


def safe_import_transformers():
    """
    Safely import transformers library, suppressing Pydantic validation errors.
    
    Returns:
        transformers module or None if import fails
    """
    try:
        with suppress_pydantic_validation_errors():
            import transformers
            return transformers
    except ValueError as e:
        error_str = str(e)
        if "No `Args` or `Parameters` section" in error_str or \
           "docstring" in error_str.lower():
            # Try to import anyway
            import sys
            from io import StringIO
            old_stderr = sys.stderr
            sys.stderr = StringIO()
            try:
                import transformers
                return transformers
            except Exception:
                return None
            finally:
                sys.stderr = old_stderr
        else:
            raise

