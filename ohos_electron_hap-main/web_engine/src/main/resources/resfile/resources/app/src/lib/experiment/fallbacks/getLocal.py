"""
Use a local PsychoPy install to get fallback profiles, which are used when running the PsychoPy 
without a local Python instance.
"""

from psychopy.experiment import getElementProfiles, getLoopProfiles, getDeviceProfiles
from liaison.websocket.websocket import LiaisonJSONEncoder
from pathlib import Path
import json

# update element profiles
(Path(__file__).parent / "components.json").write_text(
    json.dumps(getElementProfiles(), cls=LiaisonJSONEncoder, indent=4)
)
# update loop profiles
(Path(__file__).parent / "loops.json").write_text(
    json.dumps(getLoopProfiles(), cls=LiaisonJSONEncoder, indent=4)
)
# update device profiles
(Path(__file__).parent / "devices.json").write_text(
    json.dumps(getDeviceProfiles(), cls=LiaisonJSONEncoder, indent=4)
)