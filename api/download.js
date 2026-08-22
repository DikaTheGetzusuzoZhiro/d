export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { url } = req.body || {};

        if (!url || typeof url !== "string") {
            return res.status(400).json({
                error: "URL tidak valid."
            });
        }

        let target;

        try {
            target = new URL(url);
        } catch {
            return res.status(400).json({
                error: "Format URL tidak valid."
            });
        }

        if (!["http:", "https:"].includes(target.protocol)) {
            return res.status(400).json({
                error: "Protocol URL tidak didukung."
            });
        }

        const response = await fetch(target.href, {
            redirect: "follow"
        });

        if (!response.ok) {
            return res.status(502).json({
                error:
                    `Server video mengembalikan HTTP ${response.status}.`
            });
        }

        const contentType =
            response.headers.get("content-type") || "";

        if (!contentType.toLowerCase().startsWith("video/")) {
            return res.status(415).json({
                error:
                    "URL tersebut bukan direct video file. Gunakan URL file video langsung seperti .mp4."
            });
        }

        const contentLength =
            response.headers.get("content-length");

        if (
            contentLength &&
            Number(contentLength) > 100 * 1024 * 1024
        ) {
            return res.status(413).json({
                error: "Video terlalu besar. Maksimal 100 MB."
            });
        }

        res.statusCode = 200;

        res.setHeader(
            "Content-Type",
            contentType
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="exry-video.mp4"'
        );

        if (contentLength) {
            res.setHeader(
                "Content-Length",
                contentLength
            );
        }

        const buffer =
            Buffer.from(
                await response.arrayBuffer()
            );

        return res.end(buffer);

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Gagal mengambil video."
        });
    }
}
