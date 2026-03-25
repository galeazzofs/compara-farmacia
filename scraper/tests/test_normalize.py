import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils.normalize import normalize_search_term


def test_lowercase():
    assert normalize_search_term("DIPIRONA") == "dipirona"

def test_trim_whitespace():
    assert normalize_search_term("  dipirona   500mg  ") == "dipirona 500mg"

def test_remove_accents():
    assert normalize_search_term("farmácia drogão") == "farmacia drogao"

def test_standardize_dosage():
    assert normalize_search_term("dipirona 500 mg") == "dipirona 500mg"

def test_grams_to_mg():
    assert normalize_search_term("amoxicilina 1g") == "amoxicilina 1000mg"

def test_empty():
    assert normalize_search_term("") == ""
    assert normalize_search_term("   ") == ""
