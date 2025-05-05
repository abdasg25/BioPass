import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:qr_code_scanner/qr_code_scanner.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:local_auth/local_auth.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  bool _scanning = true;
  bool _processing = false;
  String _statusMessage = 'Scan a QR code to authenticate';
  String _errorMessage = '';
  final AuthService _authService = AuthService();
  final LocalAuthentication _localAuth = LocalAuthentication();

  // To ensure hot reload works with the QR scanner
  @override
  void reassemble() {
    super.reassemble();
    if (Platform.isAndroid) {
      controller?.pauseCamera();
    } else if (Platform.isIOS) {
      controller?.resumeCamera();
    }
  }

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) async {
      if (!_scanning || _processing) return;
      
      setState(() {
        _scanning = false;
        _processing = true;
        _statusMessage = 'Processing QR code...';
      });
      
      try {
        // Parse the QR data
        final parsedData = jsonDecode(scanData.code!);
        
        if (parsedData['sessionKey'] == null) {
          _setError('Invalid QR code format');
          return;
        }
        
        final sessionKey = parsedData['sessionKey'];
        
        setState(() {
          _statusMessage = 'Authenticating with fingerprint...';
        });
        
        // Request biometric authentication
        bool canAuthenticate = await _localAuth.canCheckBiometrics;
        
        if (!canAuthenticate) {
          _setError('Biometric authentication not available');
          return;
        }
        
        bool authenticated = await _localAuth.authenticate(
          localizedReason: 'Authenticate to approve login on another device',
          options: const AuthenticationOptions(
            useErrorDialogs: true,
            stickyAuth: true,
          ),
        );
        
        if (!authenticated) {
          _setError('Authentication failed');
          return;
        }
        
        setState(() {
          _statusMessage = 'Verifying authentication...';
        });
        
        // Since we can't do full WebAuthn on Flutter directly, we'll create a simplified 
        // credential object containing session key and device fingerprint
        final user = await _authService.getCurrentUser();
        
        if (user == null) {
          _setError('User not logged in');
          return;
        }
        
        // Create a simplified credential object
        // In a production app, you would need to implement proper WebAuthn credential creation
        final credential = {
          'id': user['id'] ?? '',
          'type': 'public-key',
          'rawId': base64Encode(utf8.encode(user['id'] ?? '')),
          'response': {
            'clientDataJSON': base64Encode(utf8.encode(jsonEncode({
              'type': 'webauthn.get',
              'challenge': sessionKey,
              'origin': 'android:package:com.example.mobile'
            }))),
            'authenticatorData': base64Encode(utf8.encode('authenticator-data')),
            'signature': base64Encode(utf8.encode(user['id'] ?? '')),
            'userHandle': user['username'] != null 
                ? base64Encode(utf8.encode(user['username'])) 
                : null
          }
        };
        
        // Send the credential to the server
        final result = await _authService.verifyQrSession(sessionKey, credential);
        
        if (result['success']) {
          setState(() {
            _statusMessage = 'Authentication successful!';
            _errorMessage = '';
          });
          
          Future.delayed(const Duration(seconds: 2), () {
            if (mounted) {
              Navigator.pop(context);
            }
          });
        } else {
          _setError(result['message']);
        }
      } catch (e) {
        _setError('Error processing QR code: $e');
      }
    });
  }

  void _setError(String message) {
    setState(() {
      _errorMessage = message;
      _processing = false;
      _statusMessage = 'Scan a QR code to authenticate';
    });
    
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _scanning = true;
          _errorMessage = '';
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      ),
      body: Column(
        children: [
          Expanded(
            flex: 5,
            child: QRView(
              key: qrKey,
              onQRViewCreated: _onQRViewCreated,
              overlay: QrScannerOverlayShape(
                borderColor: _scanning ? Colors.green : Colors.grey,
                borderRadius: 10,
                borderLength: 30,
                borderWidth: 10,
                cutOutSize: MediaQuery.of(context).size.width * 0.8,
              ),
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              padding: const EdgeInsets.all(16.0),
              width: double.infinity,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (_processing)
                    const CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                    ),
                  const SizedBox(height: 8),
                  Text(
                    _statusMessage,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (_errorMessage.isNotEmpty)
                    Text(
                      _errorMessage,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 14,
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
