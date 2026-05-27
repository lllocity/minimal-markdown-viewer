//
//  Minimal_Markdown_ViewerApp.swift
//  Minimal Markdown Viewer
//
//  Created by Yusuke Yoshino on 2026/05/26.
//

import SwiftUI

@main
struct Minimal_Markdown_ViewerApp: App {
    @StateObject private var viewModel = DocumentViewModel()

    var body: some Scene {
        WindowGroup {
            ContentView(viewModel: viewModel)
                .onOpenURL { url in
                    viewModel.load(url: url)
                }
        }
    }
}
