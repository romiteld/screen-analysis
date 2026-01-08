"""
Main entry point for Cloud Run service
Uses the enhanced video analyzer
"""

from video_analyzer import app

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)