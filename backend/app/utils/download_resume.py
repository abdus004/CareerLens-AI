import requests
import tempfile


def download_resume(url: str) -> str:
    response = requests.get(url)
    response.raise_for_status()

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    temp_file.write(response.content)
    temp_file.close()

    return temp_file.name