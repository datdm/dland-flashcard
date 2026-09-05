const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'history', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add currentPage state and pagination logic
const oldTimelineStateRegex = /  const \[timeFilter, setTimeFilter\] = useState<TimeFilter>\("all"\);/;

const newTimelineState = `  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  useEffect(() => {
    setCurrentPage(1);
  }, [timeFilter]);`;

content = content.replace(oldTimelineStateRegex, newTimelineState);

// 2. Add paginatedTimeline calculation
const oldGroupedTimelineEnd = `  }, [timelineItems]);`;

const newGroupedTimelineEnd = `  }, [timelineItems]);

  const totalPages = Math.ceil(groupedTimeline.length / ITEMS_PER_PAGE) || 1;
  const paginatedTimeline = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return groupedTimeline.slice(start, start + ITEMS_PER_PAGE);
  }, [groupedTimeline, currentPage]);`;

content = content.replace(oldGroupedTimelineEnd, newGroupedTimelineEnd);

// 3. Replace groupedTimeline.map with paginatedTimeline.map and add pagination controls
const oldTimelineRenderRegex = /\{groupedTimeline\.map\(\(\[date, items\]\) => \([\s\S]*?\{\/\* Date bubble \*\/\}/;

const newTimelineRender = `{paginatedTimeline.map(([date, items]) => (
              <div key={date} className="relative pl-8">
                {/* Date bubble */}`;

content = content.replace(oldTimelineRenderRegex, newTimelineRender);

// 4. Add pagination controls before </div> of Activity Timeline
const oldTimelineBottomRegex = /                    \);\s*\}\)\}\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\);\s*\}\s*$/;

const newTimelineBottom = `                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {groupedTimeline.length > ITEMS_PER_PAGE && (
            <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-500 font-medium">
                Trang <strong className="text-indigo-600 font-bold">{currentPage}</strong> / {totalPages} (Tổng cộng {groupedTimeline.length} ngày ghi nhận)
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  ← Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <span key={p} className="flex items-center">
                        {showEllipsis && <span className="px-1.5 text-xs text-gray-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={\`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer \${
                            currentPage === p
                              ? "bg-indigo-600 text-white shadow-3xs"
                              : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200"
                          }\`}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

content = content.replace(oldTimelineBottomRegex, newTimelineBottom);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated history/page.tsx with pagination for activity log!");
