# Upload new file
import requests
import json 
url = "http://localhost:8000/api/v1/files/"
access_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUwNzYzMjY5LCJpYXQiOjE3NDgxMzc1MzksImp0aSI6ImM5ODk1ZmVlMjdiNzQ2NzBiODk0ZGFkNGNmYTU3NWM3IiwidXNlcl9pZCI6MX0.m-WQK8UdI0hVDDqhrpR874eT8gVS_68-0EpMdxCPbDg"
file_path = "/home/emdy/Desktop/ok.http"
def upload_with_files_and_data():
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    with open(file_path, "rb") as f:
        files = {"file": f}
        data = {
            "title": "fichier pdf du sous-dos123",
            "tags": json.dumps(["ia", "intro"]),
            "folder": "6833000e58bf73bd99a921ea"
        }
        response = requests.post(url, headers=headers, files=files, data=data)
        print("Status code:", response.status_code)
        print("Response content:", response.text)

upload_with_files_and_data()