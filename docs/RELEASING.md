# Publishing a New Release

Releases are built and published automatically via GitHub Actions when a version tag is pushed.

1. Bump the version in `package.json`
2. Commit the change:
    ```bash
    git add package.json
    git commit -m "vX.Y.Z"
    ```
3. Tag and push:
    ```bash
    git tag vX.Y.Z
    git push origin main
    git push origin vX.Y.Z
    ```

GitHub Actions will build the Windows installer and create a **draft** GitHub Release with the artifacts attached. Once you've verified the build, go to the [Releases page](https://github.com/simonasver/music_app/releases) and click **Publish release**.
