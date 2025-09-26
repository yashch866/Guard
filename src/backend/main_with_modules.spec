# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=['/home/sakar02/Downloads/guard/src/backend'],
    binaries=[],
    datas=[
        ('camera_status.py', '.'),
        ('voice_chat.py', '.'),
        ('audio_stream_receiver.py', '.'),
        ('mic_stream_sender.py', '.'),
        ('process_manager.py', '.'),
        ('wifi_control.sh', '.'),
        ('no-wifi-auto.conf', '.'),
    ],
    hiddenimports=[
        'camera_status',
        'voice_chat', 
        'audio_stream_receiver',
        'mic_stream_sender',
        'process_manager'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['PyQt5', 'PySide2'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
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
