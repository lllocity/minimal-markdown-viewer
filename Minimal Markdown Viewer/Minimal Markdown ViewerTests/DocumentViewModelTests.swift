import XCTest
@testable import Minimal_Markdown_Viewer

final class DocumentViewModelTests: XCTestCase {

    var viewModel: DocumentViewModel!

    override func setUp() {
        super.setUp()
        viewModel = DocumentViewModel()
    }

    override func tearDown() {
        viewModel = nil
        let tempDir = FileManager.default.temporaryDirectory
        try? FileManager.default.removeItem(at: tempDir.appendingPathComponent("test.md"))
        try? FileManager.default.removeItem(at: tempDir.appendingPathComponent("empty.md"))
        try? FileManager.default.removeItem(at: tempDir.appendingPathComponent("my-note.md"))
        super.tearDown()
    }

    // 正常な Markdown ファイルの読み込み
    func testLoadValidMarkdown() throws {
        let content = "# Hello\n\nThis is **markdown**."
        let url = try createTempFile(content: content, name: "test.md")

        viewModel.load(url: url)

        XCTAssertEqual(viewModel.markdownText, content)
        XCTAssertNil(viewModel.errorMessage)
    }

    // ファイル名が正しく取得される
    func testFileNameExtraction() throws {
        let url = try createTempFile(content: "# Test", name: "my-note.md")

        viewModel.load(url: url)

        XCTAssertEqual(viewModel.fileName, "my-note.md")
    }

    // 空ファイルのエラーハンドリング
    func testLoadEmptyFile() throws {
        let url = try createTempFile(content: "", name: "empty.md")

        viewModel.load(url: url)

        XCTAssertEqual(viewModel.errorMessage, "ファイルが空です")
        XCTAssertTrue(viewModel.markdownText.isEmpty)
    }

    // 存在しないファイルのエラーハンドリング
    func testLoadNonExistentFile() {
        let url = URL(fileURLWithPath: "/nonexistent/path/file.md")

        viewModel.load(url: url)

        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertTrue(viewModel.errorMessage!.contains("ファイルを開けませんでした"))
    }

    // ヘルパー：一時ファイルを作成して URL を返す
    private func createTempFile(content: String, name: String) throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        try content.write(to: url, atomically: true, encoding: .utf8)
        return url
    }
}
