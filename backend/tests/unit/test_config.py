"""
Unit tests for application configuration.

Validates that all required settings are defined, defaults are appropriate,
and there are no naming conflicts (ISS-008, ISS-014, ISS-044, ISS-045, ISS-047).
"""

import os
import pytest


pytestmark = pytest.mark.unit


class TestSettingsCompleteness:
    """Verify all expected settings exist in the Settings class."""

    def _get_settings_class(self):
        from app.core.config import Settings
        return Settings

    def test_database_url_defined(self):
        Settings = self._get_settings_class()
        s = Settings()
        assert hasattr(s, "DATABASE_URL")
        assert s.DATABASE_URL is not None

    def test_qdrant_url_defined(self):
        Settings = self._get_settings_class()
        s = Settings()
        assert hasattr(s, "QDRANT_URL")
        assert s.QDRANT_URL is not None

    def test_qdrant_collection_name_defined(self):
        """ISS-007: collection name must come from config, not hardcoded."""
        Settings = self._get_settings_class()
        s = Settings()
        assert hasattr(s, "QDRANT_COLLECTION_NAME")
        assert s.QDRANT_COLLECTION_NAME is not None

    def test_embedding_model_name_defined(self):
        Settings = self._get_settings_class()
        s = Settings()
        assert hasattr(s, "EMBEDDING_MODEL_NAME")

    def test_chunk_size_and_overlap_defined(self):
        Settings = self._get_settings_class()
        s = Settings()
        assert hasattr(s, "CHUNK_SIZE")
        assert hasattr(s, "CHUNK_OVERLAP")
        assert s.CHUNK_SIZE > 0
        assert s.CHUNK_OVERLAP >= 0
        assert s.CHUNK_OVERLAP < s.CHUNK_SIZE

    def test_gpu_config_consistency(self):
        """ISS-014: USE_GPU and ENABLE_GPU should not both exist as separate settings."""
        Settings = self._get_settings_class()
        field_names = set(Settings.model_fields.keys()) if hasattr(Settings, 'model_fields') else set()
        has_use_gpu = "USE_GPU" in field_names
        has_enable_gpu = "ENABLE_GPU" in field_names
        if has_use_gpu and has_enable_gpu:
            pytest.fail("Both USE_GPU and ENABLE_GPU defined — consolidate to one (ISS-014)")


class TestConfigDefaults:
    """Verify defaults are appropriate."""

    def test_chunk_size_reasonable(self):
        from app.core.config import Settings
        s = Settings()
        assert 200 <= s.CHUNK_SIZE <= 4000, f"CHUNK_SIZE {s.CHUNK_SIZE} seems unreasonable"

    def test_chunk_overlap_ratio(self):
        from app.core.config import Settings
        s = Settings()
        ratio = s.CHUNK_OVERLAP / s.CHUNK_SIZE
        assert ratio <= 0.5, f"Overlap ratio {ratio:.2f} too high (>50% of chunk)"

    def test_vector_search_limit_defined(self):
        from app.core.config import Settings
        s = Settings()
        if hasattr(s, "VECTOR_SEARCH_LIMIT"):
            assert 1 <= s.VECTOR_SEARCH_LIMIT <= 100


class TestNoHardcodedValues:
    """Verify critical values aren't hardcoded in source."""

    def test_main_uses_settings_for_collection(self):
        """ISS-007: main.py should not hardcode collection_name='rag'."""
        import inspect
        try:
            from app import main
            source = inspect.getsource(main)
            hardcoded_count = source.count('collection_name="rag"') + source.count("collection_name='rag'")
            if hardcoded_count > 0:
                pytest.fail(
                    f"main.py has {hardcoded_count} hardcoded collection_name='rag' "
                    f"— use settings.QDRANT_COLLECTION_NAME instead (ISS-007)"
                )
        except ImportError:
            pytest.skip("Cannot import app.main")
