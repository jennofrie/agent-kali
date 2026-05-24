from config import load_config

def test_load_returns_dict_with_expected_keys():
    cfg = load_config()
    assert cfg["llm"]["fill"] == "claude"
    assert cfg["rag"]["defaultWorkspace"] == "ndis"
    assert cfg["fillStrategy"] == "auto"
    assert cfg["llm"]["adapters"]["claude"]["model"] == "claude-opus-4-6"
