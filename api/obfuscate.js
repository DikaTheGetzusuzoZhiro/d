function randomName(length = 10) {
    const chars =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

    let result = "_";

    for (let i = 0; i < length; i++) {
        result += chars[
            Math.floor(Math.random() * chars.length)
        ];
    }

    return result;
}

function stripComments(code) {
    return code
        .replace(/--\[\[[\s\S]*?\]\]/g, "")
        .replace(/--[^\n\r]*/g, "");
}

function minifyLua(code) {
    return code
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean)
        .join("\n");
}

function renameLocals(code) {
    const names = new Map();

    const pattern =
        /\blocal\s+([A-Za-z_][A-Za-z0-9_]*)/g;

    let match;

    while ((match = pattern.exec(code))) {
        const oldName = match[1];

        if (!names.has(oldName)) {
            names.set(oldName, randomName());
        }
    }

    for (const [oldName, newName] of names) {
        const regex =
            new RegExp(
                `\\b${oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
                "g"
            );

        code = code.replace(regex, newName);
    }

    return code;
}

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const {
            source,
            level = "basic"
        } = req.body || {};

        if (
            typeof source !== "string" ||
            !source.trim()
        ) {
            return res.status(400).json({
                error: "Source Lua kosong."
            });
        }

        if (source.length > 500000) {
            return res.status(413).json({
                error: "Source terlalu besar. Maksimal 500 KB."
            });
        }

        let code = stripComments(source);

        if (level === "strong" || level === "extreme") {
            code = renameLocals(code);
        }

        code = minifyLua(code);

        const marker = randomName(12);

        const output =
`--[[ Exry Hub Lua Obfuscator ]]
-- Protection: ${level}

local ${marker} = function()
${code}
end

${marker}()
`;

        return res.status(200).json({
            code: output
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Obfuscation gagal."
        });
    }
}
