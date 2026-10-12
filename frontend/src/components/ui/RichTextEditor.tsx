"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Link as LinkIcon, Image as ImageIcon, 
  Youtube, Code, Eye, Table as TableIcon, AlignLeft, AlignCenter, AlignRight, 
  RotateCcw, RotateCw, Check, X
} from "lucide-react";
import Button from "./Button";
import { toast } from "sonner";
import { compressImageToWebP, uploadImageToS3 } from "@/core/utils/imageCompressor";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write detailed product description, specifications, features...",
  minHeight = "350px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value || "");

  // Modal Dialog States
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Sync value into contentEditable when switching modes or initial load
  useEffect(() => {
    if (!isHtmlMode && editorRef.current) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
    setRawHtml(value || "");
  }, [value, isHtmlMode]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setRawHtml(html);
      onChange(html);
    }
  };

  const handleRawHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value;
    setRawHtml(html);
    onChange(html);
  };

  const exec = (command: string, arg: string | undefined = undefined) => {
    if (isHtmlMode) return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Insert Custom HTML Element
  const insertHtmlAtCursor = (html: string) => {
    if (isHtmlMode) {
      const newHtml = rawHtml + "\n" + html;
      setRawHtml(newHtml);
      onChange(newHtml);
      return;
    }

    if (editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const el = document.createElement("div");
        el.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node;
        let lastNode;
        while ((node = el.firstChild)) {
          lastNode = frag.appendChild(node);
        }
        range.insertNode(frag);
        if (lastNode) {
          range.setStartAfter(lastNode);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      } else {
        editorRef.current.innerHTML += html;
      }
      handleInput();
    }
  };

  // Handle Image Insertion
  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }
    const html = `<figure class="my-4 text-center">
  <img src="${imageUrl.trim()}" alt="${imageAlt.trim() || "Product Image"}" class="max-w-full rounded-xl mx-auto shadow-sm inline-block" />
  ${imageAlt.trim() ? `<figcaption class="text-xs text-slate-500 mt-1 italic">${imageAlt.trim()}</figcaption>` : ""}
</figure><p><br></p>`;
    insertHtmlAtCursor(html);
    setImageUrl("");
    setImageAlt("");
    setIsImageModalOpen(false);
    toast.success("Image inserted into description");
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const { file: webpFile } = await compressImageToWebP(file, 1600, 0.85);
      let finalUrl = "";
      try {
        finalUrl = await uploadImageToS3(webpFile);
      } catch (err) {
        finalUrl = URL.createObjectURL(webpFile);
        toast.warning("S3 credentials inactive. Using local preview URL.");
      }
      setImageUrl(finalUrl);
      toast.success("Image uploaded & compressed to WebP!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Handle YouTube Video Embed Insertion
  const handleInsertVideo = () => {
    if (!videoUrl.trim()) {
      toast.error("Please enter a YouTube video URL");
      return;
    }

    let embedId = "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = videoUrl.trim().match(regExp);

    if (match && match[2].length === 11) {
      embedId = match[2];
    } else {
      toast.error("Could not parse YouTube video ID from URL");
      return;
    }

    const html = `<div class="my-6 aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-md">
  <iframe 
    src="https://www.youtube.com/embed/${embedId}" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen
    class="w-full h-full"
  ></iframe>
</div><p><br></p>`;

    insertHtmlAtCursor(html);
    setVideoUrl("");
    setIsVideoModalOpen(false);
    toast.success("YouTube video embedded successfully");
  };

  // Handle Link Insertion
  const handleInsertLink = () => {
    if (!linkUrl.trim()) return;
    const text = linkText.trim() || linkUrl.trim();
    const html = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" class="text-brand underline hover:text-brand/80 font-medium">${text}</a> `;
    insertHtmlAtCursor(html);
    setLinkUrl("");
    setLinkText("");
    setIsLinkModalOpen(false);
  };

  // Insert Table Template
  const handleInsertTable = () => {
    const tableHtml = `<table class="w-full my-4 border-collapse border border-slate-300 text-sm">
  <thead>
    <tr class="bg-slate-100 font-bold">
      <th class="border border-slate-300 p-2 text-left">Property</th>
      <th class="border border-slate-300 p-2 text-left">Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-slate-300 p-2 font-medium">Specification</td>
      <td class="border border-slate-300 p-2">Value / Description</td>
    </tr>
  </tbody>
</table><p><br></p>`;
    insertHtmlAtCursor(tableHtml);
    toast.success("Specification table template inserted");
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent transition-all">
      {/* Top Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1 text-slate-700">
        <button
          type="button"
          onClick={() => exec("bold")}
          title="Bold (Ctrl+B)"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => exec("italic")}
          title="Italic (Ctrl+I)"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => exec("underline")}
          title="Underline (Ctrl+U)"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <Underline size={15} />
        </button>
        <button
          type="button"
          onClick={() => exec("strikeThrough")}
          title="Strikethrough"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <Strikethrough size={15} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => exec("formatBlock", "<h2>")}
          title="Heading 2"
          className="px-2 py-1 text-xs font-bold hover:bg-slate-200 rounded cursor-pointer"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<h3>")}
          title="Heading 3"
          className="px-2 py-1 text-xs font-bold hover:bg-slate-200 rounded cursor-pointer"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<p>")}
          title="Paragraph"
          className="px-2 py-1 text-xs font-medium hover:bg-slate-200 rounded cursor-pointer"
        >
          ¶ Body
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => exec("insertUnorderedList")}
          title="Bullet List"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => exec("insertOrderedList")}
          title="Numbered List"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          onClick={() => exec("formatBlock", "<blockquote>")}
          title="Quote"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <Quote size={15} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => exec("justifyLeft")}
          title="Align Left"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => exec("justifyCenter")}
          title="Align Center"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          onClick={() => exec("justifyRight")}
          title="Align Right"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <AlignRight size={15} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Insert Image Button */}
        <button
          type="button"
          onClick={() => setIsImageModalOpen(true)}
          title="Insert Image"
          className="p-1.5 hover:bg-emerald-100 text-emerald-700 rounded flex items-center gap-1 text-xs font-semibold cursor-pointer"
        >
          <ImageIcon size={15} />
          <span>Image</span>
        </button>

        {/* Insert Video Button */}
        <button
          type="button"
          onClick={() => setIsVideoModalOpen(true)}
          title="Embed YouTube Video"
          className="p-1.5 hover:bg-red-100 text-red-700 rounded flex items-center gap-1 text-xs font-semibold cursor-pointer"
        >
          <Youtube size={15} />
          <span>YouTube</span>
        </button>

        {/* Insert Link Button */}
        <button
          type="button"
          onClick={() => setIsLinkModalOpen(true)}
          title="Insert Link"
          className="p-1.5 hover:bg-blue-100 text-blue-700 rounded cursor-pointer"
        >
          <LinkIcon size={15} />
        </button>

        {/* Insert Table Button */}
        <button
          type="button"
          onClick={handleInsertTable}
          title="Insert Specs Table"
          className="p-1.5 hover:bg-slate-200 rounded text-slate-700 hover:text-slate-900 cursor-pointer"
        >
          <TableIcon size={15} />
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          {/* HTML Source Toggle */}
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
            className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              isHtmlMode 
                ? "bg-brand text-white shadow-xs" 
                : "bg-slate-200 hover:bg-slate-300 text-slate-800"
            }`}
            title="Toggle Raw HTML Source Code"
          >
            <Code size={13} />
            <span>{isHtmlMode ? "Visual View" : "HTML Source"}</span>
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      {isHtmlMode ? (
        <textarea
          value={rawHtml}
          onChange={handleRawHtmlChange}
          placeholder="<div>Paste or write raw HTML code here...</div>"
          style={{ minHeight }}
          className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900/5 focus:outline-none resize-y leading-relaxed"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          style={{ minHeight }}
          data-placeholder={placeholder}
          className="p-5 prose max-w-none focus:outline-none text-sm text-slate-800 leading-relaxed overflow-y-auto cursor-text empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
        />
      )}

      {/* MODAL 1: Insert Image Dialog */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="text-emerald-600" size={18} />
                Insert Image in Description
              </h3>
              <button 
                type="button"
                onClick={() => setIsImageModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Image from Computer (Auto-WebP)
                </label>
                <label className="w-full py-2.5 px-3 border border-dashed border-slate-300 hover:border-brand rounded-lg flex items-center justify-center gap-2 cursor-pointer bg-slate-50 text-xs font-semibold text-slate-700">
                  <ImageIcon size={16} />
                  <span>{isUploadingImage ? "Compressing & Uploading..." : "Choose Image File"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or Paste Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alt Caption (Optional)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="e.g. Aerodynamic spoiler ventilation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              {imageUrl && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsImageModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={handleInsertImage} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                Insert Image
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Insert YouTube Video Dialog */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Youtube className="text-red-600" size={18} />
                Embed YouTube Video
              </h3>
              <button 
                type="button" 
                onClick={() => setIsVideoModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  YouTube Video Link
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Paste normal YouTube video watch link or youtu.be short link.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsVideoModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={handleInsertVideo} className="text-xs bg-red-600 hover:bg-red-700 text-white">
                Embed Video
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Insert Link Dialog */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <LinkIcon size={16} /> Insert Link
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link URL</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Text (Optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsLinkModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={handleInsertLink} className="text-xs">
                Insert Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
