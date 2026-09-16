class FriendRef {
  FriendRef({required this.id, required this.displayName});
  final String id;
  final String displayName;

  factory FriendRef.fromJson(Map<String, dynamic> json) => FriendRef(
      id: json['id'] as String,
      displayName: json['displayName'] as String? ?? '?');
}

class Friendship {
  Friendship({
    required this.id,
    required this.status,
    required this.requester,
    required this.addressee,
  });

  final String id;
  final String status;
  final FriendRef requester;
  final FriendRef addressee;

  factory Friendship.fromJson(Map<String, dynamic> json) => Friendship(
        id: json['id'] as String,
        status: json['status'] as String,
        requester: FriendRef.fromJson(json['requester']),
        addressee: FriendRef.fromJson(json['addressee']),
      );

  FriendRef other(String myUserId) =>
      requester.id == myUserId ? addressee : requester;
}
