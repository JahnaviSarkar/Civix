import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'backend'))
from services.ai_service import score_severity

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True)
    args = parser.parse_args()
    with open(args.image, 'rb') as f:
        score = score_severity(f.read())
    print(f'Severity score: {score}')
