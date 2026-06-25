import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { wrapComponent } from '@pekempy/fluxer-plugin-sdk/helpers/app';
const EnhancedMessageContent = ({ OriginalComponent, ...props }) => {
    return (_jsxs("div", { style: { borderLeft: '3px solid #7289da', paddingLeft: '8px' }, children: [_jsx(OriginalComponent, { ...props }), _jsx("div", { style: { fontSize: '11px', color: '#8e9297', marginTop: '4px' }, children: "\uD83D\uDE80 Enhanced by Plugin" })] }));
};
export default wrapComponent(EnhancedMessageContent);
//# sourceMappingURL=EnhancedMessageContent.js.map