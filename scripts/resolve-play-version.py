"""Choose a Play version without logging credentials or changing any release track."""
import json
import os
import re
from pathlib import Path


def choose_version(requested, codes, run_number):
    maximum = max([int(code) for code in codes] + [0])
    if requested:
        if not re.fullmatch(r"[1-9][0-9]*", requested):
            raise ValueError("versionCode must be a positive integer")
        code = int(requested)
        if code <= maximum:
            raise ValueError("Requested versionCode must exceed every existing Play release")
    else:
        # Reserve a higher code than the local workflow counter, including previously retired tracks.
        code = max(maximum + 1, 1000 + int(run_number))
    if code > 2100000000:
        raise ValueError("Android versionCode limit reached")
    return code


def main():
    requested = os.environ.get("REQUESTED_VERSION_CODE", "")
    secret = os.environ.get("PLAY_SERVICE_ACCOUNT_JSON", "")
    codes = []
    if secret:
        from google.oauth2 import service_account
        from google.auth.transport.requests import AuthorizedSession
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(secret), scopes=["https://www.googleapis.com/auth/androidpublisher"])
        session = AuthorizedSession(credentials)
        base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.PlushLife/edits"
        response = session.post(base, json={}, timeout=45)
        response.raise_for_status()
        edit = response.json()["id"]
        try:
            tracks = session.get(f"{base}/{edit}/tracks", timeout=45)
            tracks.raise_for_status()
            codes = [code for track in tracks.json().get("tracks", []) for release in track.get("releases", []) for code in release.get("versionCodes", [])]
            # Include previously uploaded bundles, even when they are no longer on a track.
            bundles = session.get(f"{base}/{edit}/bundles", timeout=45)
            bundles.raise_for_status()
            codes += [bundle["versionCode"] for bundle in bundles.json().get("bundles", [])]
        finally:
            session.delete(f"{base}/{edit}", timeout=45).raise_for_status()
    code = choose_version(requested, codes, os.environ.get("GITHUB_RUN_NUMBER", "1"))
    name = os.environ.get("REQUESTED_VERSION_NAME", "") or f"1.0.{code}"
    if not re.fullmatch(r"[0-9A-Za-z.+_-]{1,40}", name):
        raise ValueError("Invalid versionName")
    with Path(os.environ["GITHUB_ENV"]).open("a") as output:
        output.write(f"RELEASE_VERSION_CODE={code}\nRELEASE_VERSION_NAME={name}\n")
    print(f"Android release version: {code} ({name})")


if __name__ == "__main__":
    main()
