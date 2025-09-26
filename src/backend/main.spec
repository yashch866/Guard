# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['main.py', 'camera_status.py', 'voice_chat.py', 'audio_stream_receiver.py', 'mic_stream_sender.py', 'process_manager.py'],
    pathex=['src/backend'],
    binaries=[],
    datas=[],
    hiddenimports=['camera_status', 'voice_chat', 'audio_stream_receiver', 'mic_stream_sender', 'process_manager'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['PyQt5', 'PySide2'],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='main',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
