class DeviceModel {
  DeviceModel({
    required this.id,
    required this.installationId,
    required this.platform,
    required this.model,
    required this.appVersion,
  });

  final String id;
  final String installationId;
  final String platform;
  final String model;
  final String appVersion;

  factory DeviceModel.fromJson(Map<String, dynamic> json) => DeviceModel(
        id: json['id'] as String,
        installationId: json['installationId'] as String,
        platform: json['platform'] as String,
        model: json['model'] as String,
        appVersion: json['appVersion'] as String,
      );
}

class Delegation {
  Delegation({
    required this.id,
    required this.deviceId,
    required this.ownerId,
    required this.delegateId,
    this.deviceModel,
    this.counterpartName,
  });

  final String id;
  final String deviceId;
  final String ownerId;
  final String delegateId;
  final String? deviceModel;
  final String? counterpartName;

  factory Delegation.fromJson(Map<String, dynamic> json) => Delegation(
        id: json['id'] as String,
        deviceId: json['deviceId'] as String,
        ownerId: json['ownerId'] as String,
        delegateId: json['delegateId'] as String,
        deviceModel: (json['device'] as Map?)?['model'] as String?,
        counterpartName: ((json['delegate'] ?? json['owner'])
            as Map?)?['displayName'] as String?,
      );
}
