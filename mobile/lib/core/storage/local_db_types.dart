class OutboxActionData {
  OutboxActionData({
    required this.id,
    required this.type,
    required this.payloadJson,
    required this.createdAt,
    this.status = 'pending',
    this.lastError,
  });

  final String id;
  final String type;
  final String payloadJson;
  final DateTime createdAt;
  final String status;
  final String? lastError;

  OutboxActionData copyWith({String? status, String? lastError}) =>
      OutboxActionData(
        id: id,
        type: type,
        payloadJson: payloadJson,
        createdAt: createdAt,
        status: status ?? this.status,
        lastError: lastError ?? this.lastError,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'payloadJson': payloadJson,
        'createdAt': createdAt.toIso8601String(),
        'status': status,
        'lastError': lastError,
      };

  factory OutboxActionData.fromJson(Map<String, dynamic> json) =>
      OutboxActionData(
        id: json['id'] as String,
        type: json['type'] as String,
        payloadJson: json['payloadJson'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        status: json['status'] as String? ?? 'pending',
        lastError: json['lastError'] as String?,
      );
}
