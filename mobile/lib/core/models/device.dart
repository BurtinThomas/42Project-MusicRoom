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
