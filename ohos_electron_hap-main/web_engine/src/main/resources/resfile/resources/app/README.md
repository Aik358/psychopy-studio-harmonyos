This is the rewritten PsychoPy application created in Node/Svelte/Electron

The PsychoPy application was originally written in Python and was included alongside the library code. 

In 2025 we rewrote the application to use web frameworks for the user interface. We have also separated the application code from the library code. The Svelte application code resides in this repository but calls the psychopy-lib code when experiments are run.

The advantages of using Svelte are:
- an interface that can be deployed to web-based or local environments
- a clean separation of execution code (e.g. psychopy lib) from graphical interface
- a modern toolkit with state-of-the-art features (wxPython was great in its day but does not bring the same level of features)