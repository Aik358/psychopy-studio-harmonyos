"""Pure Python fallback for websockets.speedups (replaces C extension)."""

from __future__ import annotations

from .typing import BytesLike


def apply_mask(data: BytesLike, mask: bytes | bytearray) -> bytes:
    """Apply masking to data as specified in RFC 6455 Section 5.3.

    Pure Python implementation of the C speedups.apply_mask function.
    """
    if isinstance(mask, bytearray):
        mask = bytes(mask)
    mask_len = len(mask)
    if mask_len != 4:
        raise ValueError("mask must be 4 bytes")
    # Convert to bytearray for in-place XOR
    result = bytearray(data)
    for i in range(len(result)):
        result[i] ^= mask[i & 3]
    return bytes(result)
