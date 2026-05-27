import SwiftUI
import MarkdownUI

struct MarkdownView: View {
    @ObservedObject var viewModel: DocumentViewModel

    var body: some View {
        NavigationStack {
            Group {
                if let error = viewModel.errorMessage {
                    // エラー状態
                    VStack(spacing: 16) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.largeTitle)
                            .foregroundStyle(.orange)
                        Text(error)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                } else if viewModel.markdownText.isEmpty {
                    // 待機状態（ファイル未読み込み）
                    VStack(spacing: 16) {
                        Image(systemName: "doc.text")
                            .font(.largeTitle)
                            .foregroundStyle(.secondary)
                        Text("ファイルを開いてください")
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                } else {
                    // コンテンツ表示状態
                    ScrollView {
                        Markdown(viewModel.markdownText)
                            .markdownTheme(.gitHub)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                    }
                }
            }
            .navigationTitle(viewModel.fileName.isEmpty ? "Markdown Viewer" : viewModel.fileName)
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
