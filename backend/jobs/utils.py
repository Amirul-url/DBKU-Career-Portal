def readable_document_name(file_name):
    if not file_name:
        return "Dokumen Rasmi DBKU.pdf"

    base_name = file_name.rsplit("/", 1)[-1]
    name, extension = base_name.rsplit(".", 1) if "." in base_name else (base_name, "")
    if len(name) > 8 and name[-8] == "_" and name[-7:].isalnum():
        name = name[:-8]
    readable_name = name.replace("_", " ").strip() or "Dokumen Rasmi DBKU"
    return f"{readable_name}.{extension}" if extension else readable_name


def vacancy_document_name(vacancy):
    if getattr(vacancy, "official_document_original_name", ""):
        return vacancy.official_document_original_name
    return readable_document_name(vacancy.official_document.name)
