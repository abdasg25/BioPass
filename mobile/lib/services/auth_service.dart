import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  // Change this to match your backend server address
  static const String baseUrl = 'http://localhost:5002/api/auth';
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  
  // Login with email and password
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        // Save user data and token
        await _saveUserData(data);
        return {'success': true, 'user': data['user']};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to login'
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
  
  // Logout user
  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');
    await _secureStorage.delete(key: 'token');
  }
  
  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await _secureStorage.read(key: 'token');
    return token != null;
  }
  
  // Get current user data
  Future<Map<String, dynamic>?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userString = prefs.getString('user');
    
    if (userString != null) {
      return jsonDecode(userString);
    }
    
    return null;
  }
  
  // Save user data after login
  Future<void> _saveUserData(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    
    if (data['user'] != null) {
      await prefs.setString('user', jsonEncode(data['user']));
    }
    
    if (data['token'] != null) {
      await _secureStorage.write(key: 'token', value: data['token']);
    }
  }
  
  // Verify QR session
  Future<Map<String, dynamic>> verifyQrSession(String sessionKey, Map<String, dynamic> credential) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/verify-qr-session'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'sessionKey': sessionKey,
          'credential': credential,
        }),
      );
      
      final data = jsonDecode(response.body);
      
      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['error'] ?? 'Failed to verify QR session'
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }
  
  // Get auth token
  Future<String?> getToken() async {
    return await _secureStorage.read(key: 'token');
  }
}
