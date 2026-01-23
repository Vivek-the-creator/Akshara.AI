// Pronunciation data for different languages
const pronunciations = {
  'Tamil': {
    'அ': 'ah',
    'ஆ': 'aa',
    'இ': 'i',
    'ஈ': 'ii',
    'உ': 'u',
    'ஊ': 'uu',
    'எ': 'e',
    'ஏ': 'ee',
    'ஐ': 'ai',
    'ஒ': 'o',
    'ஓ': 'oo',
    'ஔ': 'au'
  },
  'Telugu': {
    'అ': 'a',
    'ఆ': 'aa',
    'ఇ': 'i',
    'ఈ': 'ii',
    'ఉ': 'u',
    'ఊ': 'uu',
    'ఋ': 'ru',
    'ౠ': 'ruu',
    'ఎ': 'e',
    'ఏ': 'ee',
    'ఐ': 'ai',
    'ఒ': 'o',
    'ఓ': 'oo',
    'ఔ': 'au',
    'అం': 'am',
    'అః': 'ah'
  },
  'Hindi': {
    'अ': 'a',
    'आ': 'aa',
    'इ': 'i',
    'ई': 'ii',
    'उ': 'u',
    'ऊ': 'uu',
    'ऋ': 'ri',
    'ए': 'e',
    'ऐ': 'ai',
    'ओ': 'o',
    'औ': 'au',
    'अं': 'an',
    'अः': 'ah'
  }
}

// Web Speech API for pronunciation
class AudioService {
  constructor() {
    this.synth = window.speechSynthesis
    this.voices = []
    this.loadVoices()
  }

  loadVoices() {
    // Load voices when available
    const updateVoices = () => {
      this.voices = this.synth.getVoices()
    }
    
    updateVoices()
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = updateVoices
    }
  }

  // Get the best available voice for a specific language
  getVoiceForLanguage(language) {
    const languageCode = this.getLanguageCode(language)
    
    // Try to find exact match
    const exactVoice = this.voices.find(voice => 
      voice.lang === languageCode
    )
    
    if (exactVoice) return exactVoice
    
    // Try to find language family match
    const langPrefix = languageCode.split('-')[0]
    const familyVoice = this.voices.find(voice => 
      voice.lang.startsWith(langPrefix)
    )
    
    if (familyVoice) return familyVoice
    
    // Fallback to default English
    return this.voices.find(voice => voice.lang.includes('en')) || this.voices[0]
  }

  // Pronounce a letter in the specified language
  async pronounceLetter(letter, language = 'Tamil') {
    try {
      // Cancel any ongoing speech
      this.synth.cancel()

      const utterance = new SpeechSynthesisUtterance()
      
      // Get pronunciation guide for the language
      const languagePronunciations = pronunciations[language]
      const pronunciation = languagePronunciations ? languagePronunciations[letter] : letter
      
      if (pronunciation && languagePronunciations) {
        // Use pronunciation guide with English speech
        utterance.text = pronunciation
        utterance.lang = 'en-US'
        utterance.rate = 0.8
        utterance.pitch = 1.0
        utterance.volume = 1.0
      } else {
        // Use the letter directly with native language speech
        utterance.text = letter
        utterance.lang = this.getLanguageCode(language)
        utterance.rate = 0.8
        utterance.pitch = 1.0
        utterance.volume = 1.0
      }

      // Set the voice
      const voice = this.getVoiceForLanguage(language)
      if (voice) {
        utterance.voice = voice
      }

      return new Promise((resolve, reject) => {
        utterance.onend = () => resolve()
        utterance.onerror = (event) => reject(event.error)
        
        this.synth.speak(utterance)
      })
    } catch (error) {
      console.error('Error pronouncing letter:', error)
      throw error
    }
  }

  // Get language code for speech synthesis
  getLanguageCode(language) {
    const languageCodes = {
      'Tamil': 'ta-IN',
      'Telugu': 'te-IN',
      'Hindi': 'hi-IN',
      'English': 'en-US'
    }
    return languageCodes[language] || 'en-US'
  }

  // Check if speech synthesis is supported
  isSupported() {
    return 'speechSynthesis' in window
  }

  // Stop any ongoing speech
  stop() {
    this.synth.cancel()
  }
}

// Create a singleton instance
const audioService = new AudioService()

export default audioService
export { pronunciations }
