class Track {
  Track({required this.id, required this.title, required this.artist});

  final String id;
  final String title;
  final String artist;

  factory Track.fromJson(Map<String, dynamic> json) => Track(
        id: json['id'] as String,
        title: json['title'] as String,
        artist: json['artist'] as String,
      );
}
