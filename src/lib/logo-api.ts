export async function getLogoUrlViaApi(nameOrDomain?: string): Promise<string | ""> {
	const q = String(nameOrDomain || "").trim();
	if (!q) return "";
	try {
		const res = await fetch(`/api/logo?q=${encodeURIComponent(q)}`);
		if (!res.ok) return "";
		const data = await res.json().catch(() => ({} as any));
		return typeof data?.logo === "string" ? data.logo : "";
	} catch {
		return "";
	}
}


