from enum import Enum

class InventoryStatus(str, Enum):
    INSTOCK = "INSTOCK"
    LOWSTOCK = "LOWSTOCK"
    OUTOFSTOCK = "OUTOFSTOCK"