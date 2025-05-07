import yt_dlp

def get_youtube_songs_for_emotion(emotion, limit=5):
    emotion_to_query = {
        "Happy": "happy upbeat music",
        "Sad": "sad emotional songs",
        "Angry": "angry rock music",
        "Fear": "calm relaxing music",
        "Surprise": "exciting music",
        "Disgust": "chill vibes playlist",
        "Neutral": "lofi chill music"
    }

    query = emotion_to_query.get(emotion, "mood based music")

    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'extract_flat': 'in_playlist',
        'force_generic_extractor': True,
    }

    songs = []
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        search_url = f"ytsearch{limit}:{query}"
        result = ydl.extract_info(search_url, download=False)
        if 'entries' in result:
            for entry in result['entries']:
                songs.append({
                    "title": entry.get("title"),
                    "link": f"https://www.youtube.com/watch?v={entry.get('id')}",
                    "thumbnail": entry.get("thumbnail")
                })

    return songs

