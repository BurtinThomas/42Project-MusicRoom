class UserProfile {
  UserProfile({
    required this.id,
    required this.displayName,
    required this.publicInfo,
    required this.musicPreferences,
    this.friendsInfo,
    this.privateInfo,
    this.isSelf = false,
    this.email,
    this.linkedProviders = const [],
  });

  final String id;
  final String displayName;
  final Map<String, dynamic> publicInfo;
  final Map<String, dynamic> musicPreferences;
  final Map<String, dynamic>? friendsInfo;
  final Map<String, dynamic>? privateInfo;
  final bool isSelf;
  final String? email;
  final List<String> linkedProviders;

  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
        id: json['id'] as String,
        displayName: json['displayName'] as String,
        publicInfo: Map<String, dynamic>.from(json['publicInfo'] as Map? ?? {}),
        musicPreferences:
            Map<String, dynamic>.from(json['musicPreferences'] as Map? ?? {}),
        friendsInfo: json['friendsInfo'] != null
            ? Map<String, dynamic>.from(json['friendsInfo'] as Map)
            : null,
        privateInfo: json['privateInfo'] != null
            ? Map<String, dynamic>.from(json['privateInfo'] as Map)
            : null,
        isSelf: json['isSelf'] as bool? ?? false,
        email: json['email'] as String?,
        linkedProviders: [
          for (final p in (json['linkedProviders'] as List? ?? [])) '$p'
        ],
      );
}
