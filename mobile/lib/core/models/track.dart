class Track {
  Track({
    required this.id,
    required this.title,
    required this.artist,
    this.durationMs,
    this.externalRef,
  });

  final String id;
  final String title;
  final String artist;
  final int? durationMs;
  final String? externalRef;

  factory Track.fromJson(Map<String, dynamic> json) => Track(
        id: json['id'] as String,
        title: json['title'] as String,
        artist: json['artist'] as String,
        durationMs: json['durationMs'] as int?,
        externalRef: json['externalRef'] as String?,
      );
}
