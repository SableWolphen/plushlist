import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

spec = importlib.util.spec_from_file_location("verify", Path(__file__).with_name("verify-play-release.py"))
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)


class PlayVerification(unittest.TestCase):
    def test_source_revision(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = Path(directory) / "app.aab"
            with ZipFile(bundle, "w") as archive:
                archive.writestr("base/assets/public/build-info.json", json.dumps({"gitSha": "expected"}))
                archive.writestr("BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map", "# R8 mapping")
            verify.verify_bundle(bundle, "expected")
            with self.assertRaises(ValueError):
                verify.verify_bundle(bundle, "stale")

    def test_native_optimization_and_legacy_plugin(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = Path(directory) / "app.aab"
            for mapping, dex in ((None, b"modern"), ("# R8", b"Lcom/capacitorjs/plugins/statusbar/StatusBar;")):
                with ZipFile(bundle, "w") as archive:
                    archive.writestr("base/assets/public/build-info.json", json.dumps({"gitSha": "expected"}))
                    archive.writestr("base/dex/classes.dex", dex)
                    if mapping:
                        archive.writestr("BUNDLE-METADATA/com.android.tools.build.obfuscation/proguard.map", mapping)
                with self.assertRaises(ValueError):
                    verify.verify_bundle(bundle, "expected")

    def test_track_version_and_status(self):
        for status in ("completed", "inProgress"):
            self.assertEqual(verify.verify_track({"releases": [{"versionCodes": [1872], "status": status}]}, "1872")["status"], status)
        for status in ("draft", "halted"):
            with self.assertRaises(ValueError):
                verify.verify_track({"releases": [{"versionCodes": ["1872"], "status": status}]}, 1872)
        with self.assertRaises(ValueError):
            verify.verify_track({"releases": [{"versionCodes": ["1692"], "status": "completed"}]}, "1872")


if __name__ == "__main__":
    unittest.main()
