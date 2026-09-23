// Mock for deprecated expo-av in SDK 57

export const Audio = {
  requestPermissionsAsync: async (...args: any[]) => ({ status: 'granted' }),
  setAudioModeAsync: async (...args: any[]) => {},
  RecordingOptionsPresets: {
    HIGH_QUALITY: {},
  },
  Recording: {
    createAsync: async (...args: any[]) => {
      const callback = args[1];
      const interval = args[2] || 100;
      // Mock recording
      let isRecording = true;
      let durationMillis = 0;
      
      const timer = setInterval(() => {
        if (!isRecording) return;
        durationMillis += interval;
        if (callback) {
          callback({
            isRecording: true,
            durationMillis,
            metering: Math.random() * -50,
          });
        }
      }, interval);

      const recording = {
        stopAndUnloadAsync: async (...args: any[]) => {
          isRecording = false;
          clearInterval(timer);
        },
        getURI: () => 'file://mock-audio-recording.m4a',
        getStatusAsync: async (...args: any[]) => ({ durationMillis }),
      };

      return { recording };
    },
  },
  Sound: {
    createAsync: async (...args: any[]) => {
      const options = args[1] || {};
      const callback = args[2];
      let isPlaying = options.shouldPlay || false;
      let positionMillis = 0;
      const durationMillis = 5000;

      if (isPlaying && callback) {
        callback({ isLoaded: true, positionMillis, didJustFinish: false });
      }

      const timer = setInterval(() => {
        if (isPlaying) {
          positionMillis += 100;
          if (positionMillis >= durationMillis) {
            isPlaying = false;
            if (callback) callback({ isLoaded: true, positionMillis: durationMillis, didJustFinish: true });
          } else {
            if (callback) callback({ isLoaded: true, positionMillis, didJustFinish: false });
          }
        }
      }, 100);

      const sound = {
        playAsync: async (...args: any[]) => { isPlaying = true; },
        pauseAsync: async (...args: any[]) => { isPlaying = false; },
        unloadAsync: async (...args: any[]) => { isPlaying = false; clearInterval(timer); },
        setOnPlaybackStatusUpdate: (cb: any) => {}, // Mock this specifically for AudioJournalCard
      };

      return { sound };
    },
  },
};
