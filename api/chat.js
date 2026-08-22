export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    if (!process.env.GROQ_API_KEY) {
        return res.status(500).json({
            error: "GROQ_API_KEY belum dikonfigurasi di Vercel."
        });
    }

    try {
        const { messages } = req.body || {};

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                error: "Messages tidak valid."
            });
        }

        const cleanMessages = messages
            .filter(m =>
                m &&
                (m.role === "user" || m.role === "assistant") &&
                typeof m.content === "string"
            )
            .slice(-30);

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization":
                        `Bearer ${process.env.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        {
                            role: "system",
                            content:
                                "Kamu adalah Exry AI, asisten yang ramah, membantu, dan menjawab dalam bahasa yang digunakan pengguna. Jawab dengan jelas dan natural."
                        },
                        ...cleanMessages
                    ],
                    temperature: 0.7,
                    max_tokens: 2048
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Groq error:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "Groq API gagal memberikan respons."
            });
        }

        const message =
            data?.choices?.[0]?.message?.content;

        if (!message) {
            return res.status(500).json({
                error: "Respons AI kosong."
            });
        }

        return res.status(200).json({
            message
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Terjadi kesalahan pada server AI."
        });
    }
}
