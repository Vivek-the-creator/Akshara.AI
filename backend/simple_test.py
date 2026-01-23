print("Starting test...")

try:
    import google.generativeai
    print("✅ google-generativeai imported")
except Exception as e:
    print(f"❌ Error: {e}")

try:
    import PIL
    print("✅ PIL imported")
except Exception as e:
    print(f"❌ Error: {e}")

print("Test completed!")
