"""Verify the uploaded Android build and its Play track without logging credentials."""
import json
import os
import sys
from pathlib import Path
from zipfile import ZipFile


def verify_bundle(bundle, sha):
    with ZipFile(bundle) as archive:
        build = json.loads(archive.read("base/assets/public/build-info.json"))
    if not sha or build.get("gitSha") != sha:
        raise ValueError("Android bundle does not contain the expected source revision")


def verify_track(track, version):
    for release in track.get("releases", []):
        if str(version) in [str(code) for code in release.get("versionCodes", [])]:
            if release.get("status") not in ("completed", "inProgress"):
                raise ValueError("Play release is uploaded but is not active on the requested track")
            return release
    raise ValueError("Expected Android version is missing from the requested Play track")


def main():
    sha = os.environ["RELEASE_SHA"]
    verify_bundle("android/app/build/outputs/bundle/release/app-release.aab", sha)
    if sys.argv[1:] == ["--bundle-only"]:
        print(f"Android bundle source revision verified: {sha}")
        return
    from google.oauth2 import service_account
    from google.auth.transport.requests import AuthorizedSession
    version = os.environ["RELEASE_VERSION_CODE"]
    track = os.environ["PLAY_TRACK"]
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(os.environ["PLAY_SERVICE_ACCOUNT_JSON"]),
        scopes=["https://www.googleapis.com/auth/androidpublisher"])
    session = AuthorizedSession(credentials)
    base = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.PlushLife/edits"
    response = session.post(base, json={}, timeout=45)
    response.raise_for_status()
    edit = response.json()["id"]
    try:
        response = session.get(f"{base}/{edit}/tracks/{track}", timeout=45)
        response.raise_for_status()
        release = verify_track(response.json(), version)
    finally:
        session.delete(f"{base}/{edit}", timeout=45).raise_for_status()
    message = f"Verified Android {version} on Play track '{track}' ({release['status']}), source {sha}."
    print(message)
    with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as summary:
        summary.write(message + "\n\nGoogle Play review and device rollout may still be pending.\n")


if __name__ == "__main__":
    main()
