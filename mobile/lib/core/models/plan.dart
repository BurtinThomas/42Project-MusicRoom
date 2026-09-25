class Plan {
  Plan({
    required this.plan,
    required this.playlistsOwned,
    required this.freePlaylistLimit,
  });

  final String plan;
  final int playlistsOwned;
  final int freePlaylistLimit;

  bool get isFree => plan == 'FREE';
  bool get canCreatePlaylist => !isFree || playlistsOwned < freePlaylistLimit;

  factory Plan.fromJson(Map<String, dynamic> json) => Plan(
        plan: json['plan'] as String,
        playlistsOwned: json['playlistsOwned'] as int,
        freePlaylistLimit: json['freePlaylistLimit'] as int,
      );
}
