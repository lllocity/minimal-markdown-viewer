import Foundation
import Combine

class DocumentViewModel: ObservableObject {
    @Published var markdownText: String = ""
    @Published var fileName: String = ""
    @Published var errorMessage: String? = nil

    func load(url: URL) {
        fileName = url.lastPathComponent

        let accessing = url.startAccessingSecurityScopedResource()
        defer {
            if accessing {
                url.stopAccessingSecurityScopedResource()
            }
        }

        do {
            let data = try Data(contentsOf: url)
            guard let text = String(data: data, encoding: .utf8) else {
                errorMessage = "文字コードを読み取れませんでした（UTF-8 のみ対応）"
                return
            }
            guard !text.isEmpty else {
                errorMessage = "ファイルが空です"
                return
            }
            markdownText = text
            errorMessage = nil
        } catch {
            errorMessage = "ファイルを開けませんでした: \(error.localizedDescription)"
        }
    }
}
