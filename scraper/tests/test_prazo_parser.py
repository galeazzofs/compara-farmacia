import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils.prazo_parser import parse_prazo


def test_parse_dias_uteis():
    assert parse_prazo("2 dias úteis") == 2

def test_parse_dia_util():
    assert parse_prazo("1 dia útil") == 1

def test_parse_entrega_amanha():
    assert parse_prazo("Entrega amanhã") == 1

def test_parse_entrega_hoje():
    assert parse_prazo("Entrega hoje") == 0

def test_parse_number_only():
    assert parse_prazo("3") == 3

def test_parse_unknown_returns_default():
    assert parse_prazo("indisponível") == -1

def test_parse_empty():
    assert parse_prazo("") == -1
